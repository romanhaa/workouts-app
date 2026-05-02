import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Encoder, Profile } from "@garmin/fitsdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Exercise mapping using numeric IDs for categories and exercise names.
 * Based on the FIT Profile specification.
 * 
 * Category numbers (from Profile types):
 * 0 = BENCH_PRESS
 * 1 = CALF_RAISE
 * 2 = CARDIO
 * 3 = CARRY
 * 4 = CHOP
 * 5 = CORE
 * 6 = CRUNCH
 * 7 = CURL
 * 8 = DEADLIFT
 * 9 = FLYE
 * 10 = HIP_RAISE
 * 11 = HIP_STABILITY
 * 12 = HIP_SWING
 * 13 = HYPEREXTENSION
 * 14 = LATERAL_RAISE
 * 15 = LEG_CURL
 * 16 = LEG_RAISE
 * 17 = LUNGE
 * 18 = OLYMPIC_LIFT
 * 19 = PLANK
 * 20 = PLYO
 * 21 = PULL_UP
 * 22 = PUSH_UP
 * 23 = ROW
 * 24 = SHOULDER_PRESS
 * 25 = SHOULDER_RAISE
 * 26 = SHOULDER_STABILITY
 * 27 = SHRUG
 * 28 = SIT_UP
 * 29 = SQUAT
 * 30 = TOTAL_BODY
 * 31 = TRICEP_EXTENSION
 * 32 = WARM_UP
 * 33 = RUN
 * 
 * Within each category, exercise names start at 0.
 */

// Mapping of category numbers to category names for logging
// These match the exerciseCategory enum in the FIT Profile
const CATEGORY_NAMES = {
  0: "benchPress",
  1: "calfRaise",
  2: "cardio",
  3: "carry",
  4: "chop",
  5: "core",
  6: "crunch",
  7: "curl",
  8: "deadlift",
  9: "flye",
  10: "hipRaise",
  11: "hipStability",
  12: "hipSwing",
  13: "hyperextension",
  14: "lateralRaise",
  15: "legCurl",
  16: "legRaise",
  17: "lunge",
  18: "olympicLift",
  19: "plank",
  20: "plyo",
  21: "pullUp",
  22: "pushUp",
  23: "row",
  24: "shoulderPress",
  25: "shoulderStability",
  26: "shrug",
  27: "sitUp",
  28: "squat",
  29: "totalBody",
  30: "tricepsExtension",
  31: "warmUp",
  32: "run",
  33: "bike",
  34: "cardioSensors",
  35: "move",
  36: "pose",
  37: "bandedExercises",
  38: "battleRope",
  39: "elliptical",
  40: "floorClimb",
  41: "indoorBike",
  42: "indoorRow",
  43: "ladder",
  44: "sandbag",
  45: "sled",
  46: "sledgeHammer",
  47: "stairStepper",
  49: "suspension",
  50: "tire",
  52: "runIndoor",
  53: "bikeOutdoor",
};

// Mapping of common exercise names within categories for logging
// Format: { category: { name_id: "NAME" } }
const EXERCISE_NAMES = {
  22: { // pushUp
    0: "pushUp",
    1: "wideGripPushUp",
    2: "diamondPushUp",
  },
  28: { // squat
    0: "squat",
    11: "gobletSquat",
    20: "thruster",
  },
  17: { // lunge
    0: "overheadLunge",
    2: "walkingLungeWithTwist",
    4: "weightedOverheadLunge",
  },
  21: { // pullUp
    0: "bandedPullUps",
    1: "burpeesPullUp",
  },
  19: { // plank
    0: "plank",
    7: "plankToPike",
  },
  6: { // crunch
    0: "bicycleCrunch",
    10: "crossBodyMountainClimber",
  },
  8: { // deadlift
    7: "singleArmDeadlift",
  },
  14: { // lateralRaise
    0: "45DegreeCableExternalRotation",
    10: "frontRaise",
    34: "dumbbellLateralRaise",
  },
  0: { // benchPress
    2: "barbellBoardBenchPress",
    3: "barbellFloorPress",
    4: "closeGripBarbellBenchPress",
  },
  30: { // tricepsExtension
    5: "dip",
  },
  23: { // row
    0: "barbellStraightLegDeadliftToRow",
  },
  10: { // hipRaise
    0: "barbellHipThrustOnFloor",
  },
  29: { // totalBody
    1: "burpee",
    2: "inchworm",
  },
  31: { // warmUp
    5: "armCircles",
    7: "catCamel",
  },
};

/**
 * Get the human-readable name for a category
 */
function getCategoryName(categoryId) {
  return CATEGORY_NAMES[categoryId] || `UNKNOWN_CATEGORY_${categoryId}`;
}

/**
 * Get the human-readable name for an exercise within a category
 */
function getExerciseNameString(categoryId, nameId) {
  if (EXERCISE_NAMES[categoryId] && EXERCISE_NAMES[categoryId][nameId]) {
    return EXERCISE_NAMES[categoryId][nameId];
  }
  return `EXERCISE_${nameId}`;
}

const EXERCISE_MAPPING = {
  // Push-ups (category 22)
  "Push-ups": { category: 22, name: 0 }, // STANDARD_PUSH_UP
  "Push-Up": { category: 22, name: 0 },
  "Pushups": { category: 22, name: 0 },
  
  // Squats (category 28)
  "Squats": { category: 28, name: 0 }, // BASIC_SQUAT
  "Squat": { category: 28, name: 0 },
  "Air Squats": { category: 28, name: 0 },
  "Kettlebell Goblet Squats": { category: 28, name: 11 }, // GOBLET_SQUAT
  "Kettlebell Goblet Squat": { category: 28, name: 11 },
  
  // Lunges (category 17)
  "Lunges": { category: 17, name: 0 }, // ALTERNATING_LUNGE
  "Lunge": { category: 17, name: 0 },
  "Kettlebell Lunges": { category: 17, name: 4 }, // WEIGHTED_LUNGE
  "Lateral Lunges": { category: 17, name: 2 }, // SIDE_LUNGE
  
  // Pull-ups / Chin-ups (category 21)
  "Pull-ups": { category: 21, name: 0 }, // PULL_UP
  "Pull-up": { category: 21, name: 0 },
  "Chin-ups": { category: 21, name: 1 }, // CHIN_UP
  "Chin-up": { category: 21, name: 1 },
  "Scapular Pull-ups": { category: 21, name: 0 },
  
  // Planks (category 19)
  "Plank": { category: 19, name: 0 }, // PLANK
  "Plank with Shoulder Taps": { category: 19, name: 7 }, // SIDE_PLANK_AND_ROW
  "Plank to Downward Dog": { category: 19, name: 0 },
  
  // Core / Ab exercises (category 6 = CRUNCH)
  "Hollow Body Hold": { category: 6, name: 0 },
  "Mountain Climbers": { category: 6, name: 10 }, // CROSS_BODY_MOUNTAIN_CLIMBER
  "Mountain Climber": { category: 6, name: 10 },
  
  // Deadlifts / Hip Hinge (category 8)
  "Kettlebell Swings": { category: 8, name: 7 }, // SINGLE_ARM_DEADLIFT (or use category 12 = HIP_SWING)
  "Kettlebell Swing": { category: 8, name: 7 },
  
  // Shoulder exercises (category 14 = lateralRaise)
  "Dumbbell Lateral Raise": { category: 14, name: 34 }, // dumbbellLateralRaise
  "Dumbbell Lateral Raises": { category: 14, name: 34 },
  "Dumbbell Front Raises": { category: 14, name: 10 }, // frontRaise
  "Dumbbell Front Raise": { category: 14, name: 10 },
  
  // Pressing movements (category 0 = BENCH_PRESS)
  "Floor Press": { category: 0, name: 2 }, // CLOSE_GRIP_BENCH_PRESS
  
  // Tricep exercises (category 30)
  "Tricep Dips": { category: 30, name: 5 }, // DIP
  
  // Row variations (category 23)
  "Superman rows": { category: 23, name: 0 }, // BARBELL_BENT_OVER_ROW
  "Gorilla rows": { category: 23, name: 0 },
  
  // Hip exercises (category 10 = HIP_RAISE)
  "Glute Bridges": { category: 10, name: 0 }, // BRIDGE
  "Glute Bridge": { category: 10, name: 0 },
  
  // Jumping exercises (category 29 = TOTAL_BODY)
  "Jumping Jacks": { category: 29, name: 1 }, // BURPEE (closest match)
  
  // Complex movements
  "Kettlebell Thrusters": { category: 28, name: 20 }, // THRUSTER
  "Kettlebell Thruster": { category: 28, name: 20 },
  
  // Stretches and mobility (many will fall back to user-defined)
  "Cat-Cow": { category: 5, name: 0 }, // CORE
  "Bird-Dog": { category: 5, name: 0 }, // CORE
  "Child's Pose": { category: 29, name: 0 }, // TOTAL_BODY
  "Cobra Stretch": { category: 29, name: 0 },
  "Pigeon Pose (left)": { category: 29, name: 0 },
  "Pigeon Pose (right)": { category: 29, name: 0 },
  "Forward Fold": { category: 29, name: 0 },
  "Doorway Chest Stretch (left)": { category: 29, name: 0 },
  "Doorway Chest Stretch (right)": { category: 29, name: 0 },
  
  // Animal flow movements
  "Bear Crawl": { category: 29, name: 2 }, // INCHWORM or TOTAL_BODY
  "Deep Squat": { category: 28, name: 0 },
  "Static Deep Squat": { category: 28, name: 0 },
  "Beast Hold": { category: 19, name: 0 }, // PLANK
  
  // Arm circles and mobility (category 31 = warmUp)
  "Arm Circles (left)": { category: 31, name: 5 }, // armCircles
  "Arm Circles (right)": { category: 31, name: 5 },
  "Wrist Circles": { category: 29, name: 0 },
  "Wrist Release": { category: 29, name: 0 },
  
  // Specialized exercises
  "World's Greatest Stretch": { category: 29, name: 0 },
  "Wall Angels": { category: 25, name: 0 },
  "Prone Y-W Raises": { category: 14, name: 0 },
  "Thoracic Extension": { category: 29, name: 0 },
  "Chin Tucks": { category: 29, name: 0 },
  
  // Additional exercises from other workouts
  "Supported Reach": { category: 29, name: 0 },
  "Cross Body Control": { category: 5, name: 0 }, // CORE
  "Hip Flow": { category: 11, name: 0 }, // HIP_STABILITY
  "Wrist Circles": { category: 29, name: 0 },
};

/**
 * Get exercise category and name for a given exercise.
 * Priority:
 * 1. Explicit values from the step object (exerciseCategory, exerciseName)
 * 2. String matching via EXERCISE_MAPPING
 * 3. Fallback to user-defined (65534)
 * 
 * @param {string} exerciseName - The exercise name
 * @param {object} stepData - The original step data that may contain exerciseCategory/exerciseName
 * @returns {object} - { category (number), name (number) }
 */
function getExerciseCategoryAndName(exerciseName, stepData = {}) {
  // Priority 1: Check if explicit values are provided in the step
  if (stepData.exerciseCategory !== undefined && stepData.exerciseName !== undefined) {
    let category = stepData.exerciseCategory;
    
    // Handle both numeric and string categories
    if (typeof category === 'string') {
      // Find the numeric ID for this category name
      const categoryId = Object.keys(CATEGORY_NAMES).find(
        key => CATEGORY_NAMES[key] === category
      );
      category = categoryId ? parseInt(categoryId) : 0;
    }
    
    return {
      category: category,
      name: stepData.exerciseName,
    };
  }
  
  // Priority 2: Try string matching via EXERCISE_MAPPING
  const mapping = EXERCISE_MAPPING[exerciseName];
  if (mapping) {
    return {
      category: mapping.category,
      name: mapping.name,
    };
  }
  
  // Priority 3: Fallback to user-defined
  return {
    category: 0, // Unknown category
    name: 65534, // User defined
  };
}

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
          // Preserve optional exercise fields from JSON
          exerciseCategory: step.exerciseCategory,
          exerciseName: step.exerciseName,
          wktStepName: step.wktStepName,
          notes: step.notes,
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
    workout.sections.forEach((section, index) => {
      addSteps(section.steps ?? []);
      // Add rest after section if defined and it's not the last section
      if (section.restAfterSection && index < workout.sections.length - 1) {
        flat.push({
          name: "Rest Between Sections", // Descriptive name for logging
          duration: section.restAfterSection,
          isRest: true,
        });
      }
    });
  }

  return flat;
}

function createWorkoutMessages(workout, flatSteps) {
  const mesgs = [];

  // Collect unique exercises for EXERCISE_TITLE
  // Key is based on category + name + wktStepName to avoid duplicates
  const uniqueExercises = new Map();
  let exerciseTitleIndex = 0;
  
  for (const step of flatSteps) {
    if (!step.isRest) {
      const { category, name } = getExerciseCategoryAndName(step.name, step);
      const wktStepName = step.wktStepName || step.name;
      
      // Use category + name + wktStepName as the uniqueness key
      const key = `${category}-${name}-${wktStepName}`;
      
      if (!uniqueExercises.has(key)) {
        uniqueExercises.set(key, {
          category,
          name,
          wktStepName: wktStepName,
          messageIndex: exerciseTitleIndex++
        });
      }
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

  // Workout header
  mesgs.push({
    mesgNum: Profile.MesgNum.WORKOUT,
    sport: "training",
    subSport: "strengthTraining",
    numValidSteps: flatSteps.length,
    wktName: workout.name,
  });

  // Add EXERCISE_TITLE messages (one per unique exercise name)
  uniqueExercises.forEach((ex) => {
    mesgs.push({
      mesgNum: Profile.MesgNum.EXERCISE_TITLE,
      messageIndex: ex.messageIndex,
      exerciseName: ex.name,
      exerciseCategory: getCategoryName(ex.category),
      wktStepName: ex.wktStepName,
    });
  });

  // Individual steps - put exerciseCategory and exerciseName DIRECTLY in the step
  flatSteps.forEach((step, index) => {
    const stepMessage = {
      mesgNum: Profile.MesgNum.WORKOUT_STEP,
      messageIndex: index,
      durationType: "time",
      durationValue: Math.round(step.duration * 1000), // milliseconds
      durationTime: step.duration, // seconds (Garmin includes both!)
      targetType: "open",
      targetValue: 0,
      secondaryTargetValue: 0,
    };
    
    if (step.isRest) {
      stepMessage.intensity = "rest";
    } else {
      // Get exercise category and name
      const { category, name } = getExerciseCategoryAndName(step.name, step);
      const categoryName = getCategoryName(category);
      
      // Set intensity based on category
      if (categoryName === "warmUp") {
        stepMessage.intensity = "warmup";
      } else if (categoryName === "cooldown") {
        stepMessage.intensity = "cooldown";
      } else {
        stepMessage.intensity = "active";
      }
      
      // Put exercise info DIRECTLY in the step (not via exerciseNameIndex!)
      stepMessage.exerciseCategory = categoryName; // STRING!
      stepMessage.exerciseName = name; // NUMBER
      stepMessage.exerciseWeight = 0;
      stepMessage.weightDisplayUnit = "kilogram";
      
      // Add notes if provided in JSON
      if (step.notes) {
        stepMessage.notes = step.notes;
      }
    }
    
    mesgs.push(stepMessage);
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
  
  // Categorize exercises by mapping source
  const explicitlyMapped = [];
  const stringMapped = [];
  const unmapped = [];
  
  const uniqueSteps = flatSteps
    .filter(step => !step.isRest)
    .filter((step, index, arr) => 
      arr.findIndex(s => s.name === step.name) === index
    ); // unique by name
  
  uniqueSteps.forEach(step => {
    if (typeof step.exerciseCategory === 'number' && typeof step.exerciseName === 'number') {
      explicitlyMapped.push(step);
    } else if (EXERCISE_MAPPING[step.name]) {
      stringMapped.push(step);
    } else {
      unmapped.push({ name: step.name });
    }
  });
  
  // Log explicitly mapped exercises
  if (explicitlyMapped.length > 0) {
    console.log("\n✓ Explicitly mapped exercises (from JSON):");
    explicitlyMapped.forEach(step => {
      const categoryName = getCategoryName(step.exerciseCategory);
      const exerciseName = getExerciseNameString(step.exerciseCategory, step.exerciseName);
      console.log(`  ${step.name}`);
      console.log(`    → ${categoryName} / ${exerciseName} (category: ${step.exerciseCategory}, name: ${step.exerciseName})`);
    });
  }
  
  // Log string-matched exercises
  if (stringMapped.length > 0) {
    console.log("\n✓ String-matched exercises (from EXERCISE_MAPPING):");
    stringMapped.forEach(step => {
      const mapping = EXERCISE_MAPPING[step.name];
      const categoryName = getCategoryName(mapping.category);
      const exerciseName = getExerciseNameString(mapping.category, mapping.name);
      console.log(`  ${step.name}`);
      console.log(`    → ${categoryName} / ${exerciseName} (category: ${mapping.category}, name: ${mapping.name})`);
    });
  }
  
  // Log unmapped exercises
  if (unmapped.length > 0) {
    console.log("\n⚠️  Unmapped exercises (will show as 'Go' with name in notes):");
    unmapped.forEach(item => console.log(`  - ${item.name}`));
    console.log("\nTo map these, add exerciseCategory and exerciseName to the JSON, e.g.:");
    console.log('  { "type": "exercise", "name": "Arm Circles", "duration": 30,');
    console.log('    "exerciseCategory": 26, "exerciseName": 0 }');
  }
}

main();
