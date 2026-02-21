import { Decoder, Stream, Profile } from "@garmin/fitsdk";
import fs from "fs";

// Category names from Profile
const CATEGORY_NAMES = {
  0: "benchPress", 1: "calfRaise", 2: "cardio", 3: "carry", 4: "chop",
  5: "core", 6: "crunch", 7: "curl", 8: "deadlift", 9: "flye",
  10: "hipRaise", 11: "hipStability", 12: "hipSwing", 13: "hyperextension",
  14: "lateralRaise", 15: "legCurl", 16: "legRaise", 17: "lunge",
  18: "olympicLift", 19: "plank", 20: "plyo", 21: "pullUp", 22: "pushUp",
  23: "row", 24: "shoulderPress", 25: "shoulderStability", 26: "shrug",
  27: "sitUp", 28: "squat", 29: "totalBody", 30: "tricepsExtension",
  31: "warmUp", 32: "run", 33: "bike", 34: "cardioSensors",
};

function inspectFitFile(filePath) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`DETAILED FIT FILE INSPECTION`);
  console.log(`${'='.repeat(80)}\n`);
  console.log(`File: ${filePath}`);
  
  const buf = fs.readFileSync(filePath);
  const stream = Stream.fromBuffer(buf);
  
  console.log(`Size: ${buf.length} bytes`);
  console.log(`isFIT: ${Decoder.isFIT(stream)}`);
  
  const decoder = new Decoder(stream);
  console.log(`checkIntegrity: ${decoder.checkIntegrity()}`);
  
  const { messages, errors } = decoder.read({
    applyScaleAndOffset: true,
    expandSubFields: true,
    expandComponents: true,
    convertTypesToStrings: true,
    convertDateTimesToDates: true,
    includeUnknownData: false,
    mergeHeartRates: false,
    decodeMemoGlobs: false,
  });
  
  if (errors?.length) {
    console.log("Decoder errors:");
    errors.forEach((e) => console.log(`- ${String(e)}`));
  } else {
    console.log("Decoder errors: none");
  }
  
  // Show all message types present
  const messageTypes = Object.keys(messages ?? {})
    .filter((k) => (messages?.[k] ?? []).length > 0)
    .sort();
  console.log(`\nMessage types present (${messageTypes.length}): ${messageTypes.join(', ')}\n`);
  
  // FILE_ID
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE_ID Messages`);
  console.log(`${'='.repeat(80)}`);
  const fileIdMesgs = messages.fileIdMesgs || [];
  fileIdMesgs.forEach((msg, idx) => {
    console.log(`\n[${idx}] FILE_ID:`);
    console.log(JSON.stringify(msg, null, 2));
  });
  
  // FILE_CREATOR
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FILE_CREATOR Messages`);
  console.log(`${'='.repeat(80)}`);
  const fileCreatorMesgs = messages.fileCreatorMesgs || [];
  if (fileCreatorMesgs.length > 0) {
    fileCreatorMesgs.forEach((msg, idx) => {
      console.log(`\n[${idx}] FILE_CREATOR:`);
      console.log(JSON.stringify(msg, null, 2));
    });
  } else {
    console.log("\n(none)");
  }
  
  // WORKOUT
  console.log(`\n${'='.repeat(80)}`);
  console.log(`WORKOUT Messages`);
  console.log(`${'='.repeat(80)}`);
  const workoutMesgs = messages.workoutMesgs || [];
  workoutMesgs.forEach((msg, idx) => {
    console.log(`\n[${idx}] WORKOUT:`);
    console.log(JSON.stringify(msg, null, 2));
  });
  
  // EXERCISE_TITLE
  console.log(`\n${'='.repeat(80)}`);
  console.log(`EXERCISE_TITLE Messages (${messages.exerciseTitleMesgs?.length || 0})`);
  console.log(`${'='.repeat(80)}`);
  const exerciseTitleMesgs = messages.exerciseTitleMesgs || [];
  if (exerciseTitleMesgs.length > 0) {
    exerciseTitleMesgs.forEach((msg, idx) => {
      const categoryName = CATEGORY_NAMES[msg.exerciseCategory] || `unknown(${msg.exerciseCategory})`;
      console.log(`\n[${idx}] EXERCISE_TITLE (messageIndex=${msg.messageIndex}):`);
      console.log(`  exerciseCategory: ${msg.exerciseCategory} (${categoryName})`);
      console.log(`  exerciseName: ${msg.exerciseName}`);
      if (msg.wktStepName !== undefined) console.log(`  wktStepName: "${msg.wktStepName}"`);
      console.log(`  Full object:`);
      console.log(JSON.stringify(msg, null, 2));
    });
  } else {
    console.log("\n⚠️  NO EXERCISE_TITLE MESSAGES FOUND!");
    console.log("This is likely why exercises show as 'Go' on the watch.");
  }
  
  // WORKOUT_STEP
  console.log(`\n${'='.repeat(80)}`);
  console.log(`WORKOUT_STEP Messages (${messages.workoutStepMesgs?.length || 0})`);
  console.log(`${'='.repeat(80)}`);
  const workoutStepMesgs = messages.workoutStepMesgs || [];
  workoutStepMesgs.forEach((msg, idx) => {
    console.log(`\n[${idx}] WORKOUT_STEP (messageIndex=${msg.messageIndex}):`);
    
    // Show key fields
    if (msg.wktStepName !== undefined) console.log(`  wktStepName: "${msg.wktStepName}"`);
    if (msg.durationType !== undefined) console.log(`  durationType: ${msg.durationType}`);
    if (msg.durationTime !== undefined) console.log(`  durationTime: ${msg.durationTime}s`);
    if (msg.durationValue !== undefined) console.log(`  durationValue: ${msg.durationValue}`);
    if (msg.targetType !== undefined) console.log(`  targetType: ${msg.targetType}`);
    if (msg.intensity !== undefined) console.log(`  intensity: ${msg.intensity}`);
    if (msg.exerciseNameIndex !== undefined) {
      console.log(`  exerciseNameIndex: ${msg.exerciseNameIndex} ← LINKS TO EXERCISE_TITLE[${msg.exerciseNameIndex}]`);
    } else {
      console.log(`  exerciseNameIndex: MISSING! ⚠️`);
    }
    if (msg.exerciseCategory !== undefined) console.log(`  exerciseCategory: ${msg.exerciseCategory}`);
    if (msg.exerciseName !== undefined) console.log(`  exerciseName: ${msg.exerciseName}`);
    if (msg.notes !== undefined) console.log(`  notes: "${msg.notes}"`);
    
    console.log(`  Full object:`);
    console.log(JSON.stringify(msg, null, 2));
  });
  
  // MEMO_GLOB (if present)
  if (messages.memoGlobMesgs && messages.memoGlobMesgs.length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`MEMO_GLOB Messages`);
    console.log(`${'='.repeat(80)}`);
    messages.memoGlobMesgs.forEach((msg, idx) => {
      console.log(`\n[${idx}] MEMO_GLOB:`);
      console.log(JSON.stringify(msg, null, 2));
    });
  }
  
  // Summary comparison
  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`\nExercise Title Count: ${exerciseTitleMesgs.length}`);
  console.log(`Workout Step Count: ${workoutStepMesgs.length}`);
  
  if (exerciseTitleMesgs.length > 0) {
    console.log(`\nExercise Titles:`);
    exerciseTitleMesgs.forEach(ex => {
      const categoryName = CATEGORY_NAMES[ex.exerciseCategory] || `unknown`;
      console.log(`  [${ex.messageIndex}] ${categoryName}(${ex.exerciseCategory}) / name=${ex.exerciseName}`);
    });
  } else {
    console.log(`\n⚠️  NO EXERCISE TITLES - This is the problem!`);
  }
  
  if (workoutStepMesgs.length > 0) {
    console.log(`\nWorkout Steps → Exercise Links:`);
    workoutStepMesgs.forEach(step => {
      const link = step.exerciseNameIndex !== undefined 
        ? `→ EXERCISE_TITLE[${step.exerciseNameIndex}]` 
        : '→ NO LINK ⚠️';
      const intensity = step.intensity || 'active';
      const name = step.wktStepName || '(unnamed)';
      console.log(`  Step[${step.messageIndex}] "${name}" ${intensity} ${link}`);
    });
  }
  
  console.log(`\n${'='.repeat(80)}\n`);
}

// Main
const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node inspect-fit-detailed.mjs <path-to-fit-file>');
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

inspectFitFile(filePath);
