import { Profile } from "@garmin/fitsdk";

/**
 * Helper script to explore available exercise categories and exercise names
 * in the Garmin FIT SDK Profile.
 * 
 * Usage:
 *   node explore-exercises.mjs [category]
 * 
 * Examples:
 *   node explore-exercises.mjs                    # List all categories
 *   node explore-exercises.mjs PUSH_UP            # List push-up exercises
 *   node explore-exercises.mjs SQUAT              # List squat exercises
 */

function listAllCategories() {
  console.log("=".repeat(80));
  console.log("Available Exercise Categories in Garmin FIT SDK");
  console.log("=".repeat(80));
  console.log("");
  
  const categories = Profile.ExerciseCategory;
  const categoryNames = Object.keys(categories).filter(key => typeof categories[key] === 'number');
  
  console.log(`Found ${categoryNames.length} exercise categories:\n`);
  
  // Sort alphabetically for easier browsing
  categoryNames.sort().forEach(name => {
    console.log(`  ${categories[name].toString().padStart(3)}: ${name}`);
  });
  
  console.log("");
  console.log("Usage: node explore-exercises.mjs [CATEGORY_NAME]");
  console.log("Example: node explore-exercises.mjs PUSH_UP");
  console.log("");
}

function listExercisesInCategory(categoryName) {
  const categoryKey = categoryName.toUpperCase().replace(/-/g, '_');
  
  // Check if category exists
  if (!(categoryKey in Profile.ExerciseCategory)) {
    console.error(`Error: Category "${categoryKey}" not found.`);
    console.error(`Run without arguments to see available categories.`);
    process.exit(1);
  }
  
  // Build the exercise name enum key
  // E.g., "PUSH_UP" -> "PushUpExerciseName"
  const words = categoryKey.split('_');
  const enumName = words
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join('') + 'ExerciseName';
  
  console.log("=".repeat(80));
  console.log(`Exercises in category: ${categoryKey}`);
  console.log("=".repeat(80));
  console.log("");
  
  // Check if the exercise name enum exists
  if (!(enumName in Profile)) {
    console.log(`No specific exercise names found for ${categoryKey}.`);
    console.log(`This category might use generic exercise indices (0, 1, 2, etc.)`);
    console.log(`or might not have predefined exercise names in the SDK.`);
    console.log("");
    console.log("Try using:");
    console.log(`  { category: Profile.ExerciseCategory.${categoryKey}, name: 0 }`);
    console.log("");
    return;
  }
  
  const exercises = Profile[enumName];
  const exerciseNames = Object.keys(exercises).filter(key => typeof exercises[key] === 'number');
  
  console.log(`Found ${exerciseNames.length} exercises:\n`);
  
  // Sort by value for easier reference
  exerciseNames
    .sort((a, b) => exercises[a] - exercises[b])
    .forEach(name => {
      const value = exercises[name];
      console.log(`  ${value.toString().padStart(3)}: ${name}`);
    });
  
  console.log("");
  console.log("To use in EXERCISE_MAPPING:");
  console.log(`"Your Exercise Name": {`);
  console.log(`  category: Profile.ExerciseCategory.${categoryKey},`);
  console.log(`  name: ${exercises[exerciseNames[0]]}  // ${exerciseNames[0]}`);
  console.log(`},`);
  console.log("");
}

function searchExercises(searchTerm) {
  console.log("=".repeat(80));
  console.log(`Searching for exercises matching: "${searchTerm}"`);
  console.log("=".repeat(80));
  console.log("");
  
  const categories = Profile.ExerciseCategory;
  const categoryNames = Object.keys(categories).filter(key => typeof categories[key] === 'number');
  
  let foundAny = false;
  
  categoryNames.forEach(categoryName => {
    const words = categoryName.split('_');
    const enumName = words
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join('') + 'ExerciseName';
    
    if (enumName in Profile) {
      const exercises = Profile[enumName];
      const exerciseNames = Object.keys(exercises).filter(key => typeof exercises[key] === 'number');
      
      const matches = exerciseNames.filter(name => 
        name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matches.length > 0) {
        foundAny = true;
        console.log(`\nCategory: ${categoryName}`);
        matches.forEach(name => {
          const value = exercises[name];
          console.log(`  ${value.toString().padStart(3)}: ${name}`);
          console.log(`       → { category: Profile.ExerciseCategory.${categoryName}, name: ${value} }`);
        });
      }
    }
  });
  
  if (!foundAny) {
    console.log(`No exercises found matching "${searchTerm}"`);
  }
  
  console.log("");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  listAllCategories();
} else if (args[0] === '--search' && args.length > 1) {
  searchExercises(args[1]);
} else {
  listExercisesInCategory(args[0]);
}

// Show help for search functionality
if (args.length === 0) {
  console.log("You can also search across all exercises:");
  console.log("  node explore-exercises.mjs --search lunge");
  console.log("");
}
