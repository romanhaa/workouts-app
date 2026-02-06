// src/WorkoutRunner.test.ts
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMemo } from 'react';
import type { Workout, RunnabaleWorkoutStep, RunnableStep, RepetitionStep } from './types';

// Helper function to extract the allSteps logic from WorkoutRunner.tsx
const useFlattenedSteps = (workout: Workout) => {
  type FlattenedWorkoutStep = {
    step: RunnableStep;
    sectionName?: string;
  };

  const allSteps: FlattenedWorkoutStep[] = useMemo(() => {
    const flattenSteps = (steps: RunnabaleWorkoutStep[], sectionName?: string): FlattenedWorkoutStep[] => {
      let flattened: FlattenedWorkoutStep[] = [];
      steps.forEach(step => {
        if (step.type === 'repetition') {
          for (let i = 0; i < step.count; i++) {
            flattened = flattened.concat(flattenSteps(step.steps, sectionName));
            if (i < step.count - 1 && step.restBetweenReps) {
              flattened.push({ step: { type: 'rest', duration: step.restBetweenReps }, sectionName });
            }
          }
        } else {
          flattened.push({ step, sectionName });
        }
      });
      return flattened;
    };

    if (workout.sections) {
      return workout.sections.flatMap(section => flattenSteps(section.steps, section.name));
    } else if (workout.steps) {
      return flattenSteps(workout.steps);
    }
    return [];
  }, [workout]);

  return allSteps;
};

describe('WorkoutRunner - allSteps flattening logic', () => {
  it('should flatten a simple workout with steps correctly', () => {
    const workout: Workout = {
      id: 'simple',
      name: 'Simple Workout',
      steps: [
        { type: 'exercise', name: 'Warmup', duration: 30 },
        { type: 'rest', duration: 10 },
        { type: 'exercise', name: 'Cool Down', duration: 20 },
      ],
    };

    const { result } = renderHook(() => useFlattenedSteps(workout));

    expect(result.current.length).toBe(3);
    expect(result.current[0].step).toEqual({ type: 'exercise', name: 'Warmup', duration: 30 });
    expect(result.current[1].step).toEqual({ type: 'rest', duration: 10 });
    expect(result.current[2].step).toEqual({ type: 'exercise', name: 'Cool Down', duration: 20 });
    expect(result.current[0].sectionName).toBeUndefined();
  });

  it('should flatten a workout with sections correctly', () => {
    const workout: Workout = {
      id: 'sectioned',
      name: 'Sectioned Workout',
      sections: [
        {
          name: 'Part A',
          steps: [{ type: 'exercise', name: 'Ex1', duration: 15 }],
        },
        {
          name: 'Part B',
          steps: [{ type: 'rest', duration: 5 }, { type: 'exercise', name: 'Ex2', duration: 25 }],
        },
      ],
    };

    const { result } = renderHook(() => useFlattenedSteps(workout));

    expect(result.current.length).toBe(3);
    expect(result.current[0].step).toEqual({ type: 'exercise', name: 'Ex1', duration: 15 });
    expect(result.current[0].sectionName).toBe('Part A');
    expect(result.current[1].step).toEqual({ type: 'rest', duration: 5 });
    expect(result.current[1].sectionName).toBe('Part B');
    expect(result.current[2].step).toEqual({ type: 'exercise', name: 'Ex2', duration: 25 });
    expect(result.current[2].sectionName).toBe('Part B');
  });

  it('should flatten a workout with repetitions within steps correctly', () => {
    const repetition: RepetitionStep = {
      type: 'repetition',
      count: 2,
      steps: [
        { type: 'exercise', name: 'RepEx1', duration: 10 },
        { type: 'rest', duration: 5 },
      ],
      restBetweenReps: 3,
    };
    const workout: Workout = {
      id: 'repetition',
      name: 'Repetition Workout',
      steps: [
        { type: 'exercise', name: 'PreRep', duration: 20 },
        repetition,
        { type: 'exercise', name: 'PostRep', duration: 15 },
      ],
    };

    const { result } = renderHook(() => useFlattenedSteps(workout));

    expect(result.current.length).toBe(7); // PreRep + (RepEx1 + Rest + RBR) * 1 + (RepEx1 + Rest) * 1 + PostRep
    // 20 + (10 + 5 + 3) + (10 + 5) + 15 = 20 + 18 + 15 + 15 = 68
    expect(result.current[0].step).toEqual({ type: 'exercise', name: 'PreRep', duration: 20 });
    // First repetition
    expect(result.current[1].step).toEqual({ type: 'exercise', name: 'RepEx1', duration: 10 });
    expect(result.current[2].step).toEqual({ type: 'rest', duration: 5 });
    expect(result.current[3].step).toEqual({ type: 'rest', duration: 3 }); // Rest between reps
    // Second repetition
    expect(result.current[4].step).toEqual({ type: 'exercise', name: 'RepEx1', duration: 10 });
    expect(result.current[5].step).toEqual({ type: 'rest', duration: 5 });
    expect(result.current[6].step).toEqual({ type: 'exercise', name: 'PostRep', duration: 15 });
    expect(result.current[1].sectionName).toBeUndefined();
  });

  it('should flatten a workout with nested repetitions within sections correctly', () => {
    const innerRep: RepetitionStep = {
      type: 'repetition',
      count: 2,
      steps: [{ type: 'exercise', name: 'InnerEx', duration: 5 }],
      restBetweenReps: 2,
    };
    const outerRep: RepetitionStep = {
      type: 'repetition',
      count: 1, // Only one outer repetition
      steps: [
        { type: 'exercise', name: 'OuterEx1', duration: 10 },
        innerRep,
      ],
    };
    const workout: Workout = {
      id: 'nested-rep-section',
      name: 'Nested Rep Section Workout',
      sections: [
        {
          name: 'Main Section',
          steps: [
            { type: 'exercise', name: 'StartEx', duration: 15 },
            outerRep,
            { type: 'rest', duration: 5 },
          ],
        },
      ],
    };

    const { result } = renderHook(() => useFlattenedSteps(workout));

    expect(result.current.length).toBe(6); // StartEx + OuterEx1 + (InnerEx + RBR + InnerEx) + Rest
    // StartEx (15) + OuterEx1 (10) + InnerEx (5) + RBR (2) + InnerEx (5) + Rest (5) = 42
    expect(result.current[0].step).toEqual({ type: 'exercise', name: 'StartEx', duration: 15 });
    expect(result.current[0].sectionName).toBe('Main Section');
    expect(result.current[1].step).toEqual({ type: 'exercise', name: 'OuterEx1', duration: 10 });
    expect(result.current[1].sectionName).toBe('Main Section');
    expect(result.current[2].step).toEqual({ type: 'exercise', name: 'InnerEx', duration: 5 });
    expect(result.current[2].sectionName).toBe('Main Section');
    expect(result.current[3].step).toEqual({ type: 'rest', duration: 2 });
    expect(result.current[3].sectionName).toBe('Main Section');
    expect(result.current[4].step).toEqual({ type: 'exercise', name: 'InnerEx', duration: 5 });
    expect(result.current[4].sectionName).toBe('Main Section');
    expect(result.current[5].step).toEqual({ type: 'rest', duration: 5 });
    expect(result.current[5].sectionName).toBe('Main Section');
  });

  it('should handle empty workout', () => {
    const workout: Workout = { id: 'empty', name: 'Empty Workout' };
    const { result } = renderHook(() => useFlattenedSteps(workout));
    expect(result.current.length).toBe(0);
  });
});
