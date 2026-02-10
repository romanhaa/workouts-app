import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Encoder, Profile } from "@garmin/fitsdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadWorkoutsJson() {
  const workoutsPath = path.join(__dirname, "..", "public", "workouts.json");
  const raw = fs.readFileSync(workoutsPath, "utf-8");
  return JSON.parse(raw);
}

function findWorkoutById(allWorkouts, id) {
  return allWorkouts.workouts.find((w) => w.id === id);
}

/**
 * Flatten your workout format into a simple list of timed steps that
 * can be mapped to FIT WORKOUT_STEP messages.
 *
 * - Repetition blocks are unrolled into individual steps.
 * - Sections are ignored for timing (only step order matters).
 */
function flattenWorkoutSteps(workout) {
  const flat = [];

  const addSteps = (steps) => {
    for (const step of steps) {
      if (step.type === "exercise") {
        flat.push({
          name: step.name,
          duration: step.duration,
          isRest: false,
        });
      } else if (step.type === "rest") {
        flat.push({
          name: "Rest",
          duration: step.duration,
          isRest: true,
        });
      } else if (step.type === "repetition") {
        const count = typeof step.count === "number" ? step.count : 1;
        const restBetweenReps =
          typeof step.restBetweenReps === "number"
            ? step.restBetweenReps
            : undefined;

        for (let repIndex = 0; repIndex < count; repIndex += 1) {
          addSteps(step.steps ?? []);

          const isLastRep = repIndex === count - 1;
          if (!isLastRep && restBetweenReps && restBetweenReps > 0) {
            flat.push({
              name: "Rest",
              duration: restBetweenReps,
              isRest: true,
            });
          }
        }
      }
    }
  };

  if (Array.isArray(workout.steps) && workout.steps.length > 0) {
    addSteps(workout.steps);
  } else if (Array.isArray(workout.sections)) {
    for (const section of workout.sections) {
      addSteps(section.steps ?? []);
    }
  }

  return flat;
}

function createWorkoutMessages(workout, flatSteps) {
  const mesgs = [];

  // Map to store unique exercise names and their assigned messageIndex for EXERCISE_TITLE
  const exerciseTitleMap = new Map();
  let exerciseTitleIndex = 0;

  // Collect unique exercise names and create EXERCISE_TITLE messages
  const exerciseTitleMesgs = [];
  for (const step of flatSteps) {
    if (!step.isRest && !exerciseTitleMap.has(step.name)) {
      exerciseTitleMap.set(step.name, exerciseTitleIndex);
      exerciseTitleMesgs.push({
        mesgNum: Profile.MesgNum.EXERCISE_TITLE,
        messageIndex: exerciseTitleIndex,
        // Use a placeholder for the exercise name ID. 65534 is often used for "user defined".
        exerciseName: 65534,
        // A generic category for now, assuming it's 0 (undefined/other)
        exerciseCategory: 0,
      });
      exerciseTitleIndex++;
    }
  }

  // Basic File ID for a workout file
  mesgs.push({
    mesgNum: Profile.MesgNum.FILE_ID,
    type: "workout",
    manufacturer: "development",
    product: 0,
    timeCreated: new Date(),
    serialNumber: 1234,
  });

  // Workout header (sport must be from main sport enum, e.g. "training"; "strengthTraining" is a subSport)
  mesgs.push({
    mesgNum: Profile.MesgNum.WORKOUT,
    sport: "training",
    subSport: "strengthTraining",
    numValidSteps: flatSteps.length,
    wktName: workout.name.slice(0, 15),
  });

  // Add all EXERCISE_TITLE messages
  mesgs.push(...exerciseTitleMesgs);

  // Individual steps
  flatSteps.forEach((step, index) => {
    mesgs.push({
      mesgNum: Profile.MesgNum.WORKOUT_STEP,
      messageIndex: index,
      wktStepName: step.name.slice(0, 15),
      durationType: "time",
      // For durationType=time, FIT uses a scaled "durationTime" subfield with scale=1000 (seconds).
      // The encoder expects the *raw* value, so store milliseconds here.
      durationValue: Math.round(step.duration * 1000),
      intensity: step.isRest ? "rest" : "active",
      targetType: "open",
      // Devices often ignore wktStepName and show "Go" for custom steps,
      // but they do display the "notes" text for the step when it starts
      // and on a detail screen. Put the full exercise name here.
      notes: step.name,
    });
  });

  return mesgs;
}

function encodeWorkoutToFit(mesgs, outputPath) {
  const encoder = new Encoder();
  mesgs.forEach((mesg) => encoder.writeMesg(mesg));
  const uint8Array = encoder.close();
  fs.writeFileSync(outputPath, uint8Array);
}

function main() {
  const [, , workoutIdArg] = process.argv;
  if (!workoutIdArg) {
    // eslint-disable-next-line no-console
    console.error(
      "Usage: npm run export-fit -- <workout-id>\nExample: npm run export-fit -- dry-land-swimmer",
    );
    process.exit(1);
  }

  const allWorkouts = loadWorkoutsJson();
  const workout = findWorkoutById(allWorkouts, workoutIdArg);

  if (!workout) {
    // eslint-disable-next-line no-console
    console.error(`Workout with id "${workoutIdArg}" not found.`);
    process.exit(1);
  }

  const flatSteps = flattenWorkoutSteps(workout);
  if (flatSteps.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      `Workout "${workout.id}" has no runnable steps after flattening.`,
    );
    process.exit(1);
  }

  const mesgs = createWorkoutMessages(workout, flatSteps);
  const outputDir = path.join(__dirname, "..", "exports");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  const safeId = workout.id.replace(/[^a-zA-Z0-9-_]+/g, "_");
  const outputPath = path.join(outputDir, `${safeId}.fit`);

  encodeWorkoutToFit(mesgs, outputPath);

  // eslint-disable-next-line no-console
  console.log(`Exported workout "${workout.id}" to ${outputPath}`);
}

main();

