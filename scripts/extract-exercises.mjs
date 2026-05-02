import { Profile } from '@garmin/fitsdk';
import fs from 'fs';

const categories = Profile.types.exerciseCategory;
const results = [];

// Header for TSV
results.push(['Exercise Name', 'Exercise Number', 'Category Name', 'Category Number'].join('\t'));

for (const [catNum, catName] of Object.entries(categories)) {
    if (catName === 'unknown') continue;

    // The dictionaries are named like "benchPressExerciseName"
    const exerciseNameDictName = `${catName}ExerciseName`;
    const exercises = Profile.types[exerciseNameDictName];

    if (exercises) {
        for (const [exNum, exName] of Object.entries(exercises)) {
            results.push([exName, exNum, catName, catNum].join('\t'));
        }
    }
}

const output = results.join('\n');
fs.writeFileSync('exercises.tsv', output);
console.log('Successfully exported exercises to exercises.tsv');
// Also printing the first few lines to confirm
console.log('\nPreview (first 10 lines):');
console.log(results.slice(0, 10).join('\n'));
