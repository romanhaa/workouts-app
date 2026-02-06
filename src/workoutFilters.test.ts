// src/workoutFilters.test.ts
import { describe, it, expect } from 'vitest';
import { _filterWorkouts } from './workoutFilters';
import type { Workout } from './types';

describe('_filterWorkouts', () => {
  const mockWorkouts: Workout[] = [
    { id: 'workout-1', name: 'Workout One', steps: [] },
    { id: 'workout-2', name: 'Workout Two', sections: [] },
    { id: 'test', name: 'Test Workout (no number)', steps: [] },
    { id: 'test-1', name: 'Test Workout One', steps: [] },
    { id: 'test-99', name: 'Test Workout Ninety-Nine', sections: [] },
  ];

  it('should return all workouts in development mode', () => {
    const filtered = _filterWorkouts(mockWorkouts, true); // isDev = true
    expect(filtered).toEqual(mockWorkouts);
  });

  it('should filter out test workouts in production mode', () => {
    const filtered = _filterWorkouts(mockWorkouts, false); // isDev = false
    expect(filtered).toEqual([
      { id: 'workout-1', name: 'Workout One', steps: [] },
      { id: 'workout-2', name: 'Workout Two', sections: [] },
      { id: 'test', name: 'Test Workout (no number)', steps: [] }, // This is no longer filtered
    ]);
  });

  it('should handle an empty array gracefully', () => {
    const filtered = _filterWorkouts([], false); // isDev = false
    expect(filtered).toEqual([]);
  });

  it('should handle an array with only test workouts in production mode', () => {
    const onlyTestWorkouts: Workout[] = [
      { id: 'test-workout-only', name: 'Only Test', steps: [] },
      { id: 'test', name: 'Another Test', sections: [] },
      { id: 'test-123', name: 'Filtered Test', steps: [] }, // This will be filtered
    ];
    const filtered = _filterWorkouts(onlyTestWorkouts, false); // isDev = false
    expect(filtered).toEqual([
      { id: 'test-workout-only', name: 'Only Test', steps: [] },
      { id: 'test', name: 'Another Test', sections: [] },
    ]);
  });
});
