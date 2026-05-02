# Garmin Exercise Mapping Guide

## How it works

When exporting to FIT, each exercise step needs a Garmin **category ID** and **exercise name ID** so the watch can display the right name, animation, and muscle map in Garmin Connect.

Resolution happens in priority order (`scripts/export-fit.mjs` → `getExerciseCategoryAndName()`):

1. **Explicit fields in the workout JSON** — if the step has `exerciseCategory` and `exerciseName` set, those are used as-is. Use this for precise control.
2. **`EXERCISE_MAPPING` string lookup** — case-insensitive match on the exercise `name`. Use this for exercises you want mapped the same way everywhere without annotating every JSON step.
3. **Fallback** — category `0`, name `65534` (user-defined). Shows as a generic "Go" exercise on the watch.

---

## Finding the right IDs

`exercises.tsv` (repo root) is the authoritative list of all exercises from the `@garmin/fitsdk`. Columns:

```
ExerciseName    ExerciseNumber    CategoryName    CategoryNumber
```

Example rows:
```
gobletSquat         37    squat        28
kettlebellSwing     23    hipRaise     10
jumpingJacks        12    cardio        2
thrusters           79    squat        28
```

Search it for the exercise you want:
```bash
grep -i "squat" exercises.tsv
```

The **ExerciseNumber** is the `name` field; the **CategoryNumber** is the `category` field.

---

## Adding a new exercise

### Option A — Add to `EXERCISE_MAPPING` (recommended for reuse)

In `scripts/export-fit.mjs`, find the relevant section in `EXERCISE_MAPPING` and add an entry:

```js
"Romanian Deadlift": { category: 8, name: 14 }, // romanianDeadlift
```

The comment is optional but helps when auditing later. Lookup the values in `exercises.tsv`.

### Option B — Annotate the JSON step directly

In `public/workouts.json`, add `exerciseCategory` and `exerciseName` to the step:

```json
{
  "type": "exercise",
  "name": "Romanian Deadlift",
  "duration": 45,
  "exerciseCategory": 8,
  "exerciseName": 14
}
```

Use this when an exercise has a different best-fit mapping depending on the workout context, or when the mapping is one-off.

---

## Testing

Run the export and check the output:

```bash
node scripts/export-fit.mjs <workout-id>
```

The script prints which exercises were explicitly mapped from JSON, which were matched via `EXERCISE_MAPPING`, and which fell back to "Go". No `⚠️ Unmapped` line means everything is covered.

Copy the generated `.fit` file from `exports/` to the `GARMIN/WORKOUT/` folder on your watch.

---

## Tips

- **Start with `exercises.tsv`** — don't guess IDs. Name 11 in squat is not goblet squat.
- **Pick the most specific match** — `kettlebellSwing` in `hipRaise` is better than a generic `totalBody` fallback.
- **No perfect match?** Use the closest category's base exercise (name `0`) — it gives the watch a reasonable muscle map even if the name isn't exact.
- **Yoga/mobility/stretches** — use `warmUp` (31), `core` (5), or `pose` (36) depending on the movement. Check `exercises.tsv` for entries in those categories.
