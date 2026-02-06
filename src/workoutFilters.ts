// src/workoutFilters.ts
import type { Workout } from './types';

export const _filterWorkouts = (workouts: Workout[], isDev: boolean): Workout[] => {
  if (isDev) {
    return workouts;
  } else {
    return workouts.filter((workout) => !/^test-\d+$/.test(workout.id));
  }
};

export const filterTestWorkouts = (workouts: Workout[]): Workout[] => {
  return _filterWorkouts(workouts, import.meta.env.DEV);
};
