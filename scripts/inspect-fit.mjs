import fs from "fs";
import { Decoder, Stream, Profile } from "@garmin/fitsdk";

function main() {
  const [, , fitPath] = process.argv;
  if (!fitPath) {
    // eslint-disable-next-line no-console
    console.error("Usage: node scripts/inspect-fit.mjs <path-to-fit>");
    process.exit(1);
  }

  const buf = fs.readFileSync(fitPath);
  const stream = Stream.fromBuffer(buf);

  // eslint-disable-next-line no-console
  console.log(`File: ${fitPath}`);
  // eslint-disable-next-line no-console
  console.log(`Size: ${buf.length} bytes`);
  // eslint-disable-next-line no-console
  console.log(`isFIT: ${Decoder.isFIT(stream)}`);

  const decoder = new Decoder(stream);
  // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.log("Decoder errors:");
    errors.forEach((e) => console.log(`- ${String(e)}`));
  } else {
    // eslint-disable-next-line no-console
    console.log("Decoder errors: none");
  }

  const workout = messages?.workoutMesgs?.[0];
  const steps = messages?.workoutStepMesgs ?? [];

  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log(
    `WorkoutMesg: ${
      workout
        ? JSON.stringify(
            {
              sport: workout.sport,
              subSport: workout.subSport,
              numValidSteps: workout.numValidSteps,
              wktName: workout.wktName,
            },
            null,
            2,
          )
        : "missing"
    }`,
  );

  // eslint-disable-next-line no-console
  console.log(`WorkoutStepMesgs: ${steps.length}`);
  steps.slice(0, 8).forEach((s) => {
    const name = s.wktStepName ?? "";
    const durationType = s.durationType;
    const durationSeconds =
      durationType === "time" ? s.durationTime : s.durationValue;

    // eslint-disable-next-line no-console
    console.log(
      `- #${s.messageIndex} ${name} | durationType=${durationType} duration=${durationSeconds}`,
    );
  });

  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log(
    `Mesg types present: ${Object.keys(messages ?? {})
      .filter((k) => (messages?.[k] ?? []).length > 0)
      .sort()
      .join(", ")}`,
  );

  // eslint-disable-next-line no-console
  console.log(
    `Profile MesgNum.WORKOUT=${Profile.MesgNum.WORKOUT} WORKOUT_STEP=${Profile.MesgNum.WORKOUT_STEP}`,
  );
}

main();

