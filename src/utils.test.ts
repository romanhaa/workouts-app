// src/utils.test.ts
import { describe, it, expect } from 'vitest';
import { calculateStepsDuration, calculateTotalWorkoutDuration, formatDuration, formatTimeLeft } from './utils';
import type { Workout, RepetitionStep, ExerciseStep, RestStep } from './types';

describe('utils', () => {
  describe('calculateStepsDuration', () => {
    it('should correctly calculate duration for simple steps', () => {
      const steps: (ExerciseStep | RestStep)[] = [
        { type: 'exercise', name: 'Push-ups', duration: 30 },
        { type: 'rest', duration: 10 },
      ];
      expect(calculateStepsDuration(steps)).toBe(40);
    });

    it('should correctly calculate duration for repetition steps', () => {
      const nestedSteps: (ExerciseStep | RestStep)[] = [
        { type: 'exercise', name: 'Squats', duration: 20 },
        { type: 'rest', duration: 5 },
      ];
      const repetition: RepetitionStep = {
        type: 'repetition',
        count: 2,
        steps: nestedSteps,
        restBetweenReps: 10,
      };
      // (20 + 5) * 2 + 10 (rest between reps) = 50 + 10 = 60
      expect(calculateStepsDuration([repetition])).toBe(60);
    });

    it('should handle nested repetitions', () => {
      const innerSteps: (ExerciseStep | RestStep)[] = [
        { type: 'exercise', name: 'Plank', duration: 15 },
      ];
      const innerRepetition: RepetitionStep = {
        type: 'repetition',
        count: 2,
        steps: innerSteps,
      };
      const steps: (ExerciseStep | RestStep | RepetitionStep)[] = [
        { type: 'exercise', name: 'Warmup', duration: 60 },
        innerRepetition,
        { type: 'rest', duration: 30 },
      ];
      // Warmup (60) + (Plank (15) * 2) + Rest (30) = 60 + 30 + 30 = 120
      expect(calculateStepsDuration(steps)).toBe(120);
    });

    it('should return 0 for empty steps array', () => {
      expect(calculateStepsDuration([])).toBe(0);
    });
  });

  describe('calculateTotalWorkoutDuration', () => {
    it('should correctly calculate total duration for workout with steps', () => {
      const workout: Workout = {
        id: '1',
        name: 'Test Workout',
        steps: [
          { type: 'exercise', name: 'Jump', duration: 20 },
          { type: 'rest', duration: 10 },
        ],
      };
      expect(calculateTotalWorkoutDuration(workout)).toBe(30);
    });

    it('should correctly calculate total duration for workout with sections', () => {
      const workout: Workout = {
        id: '2',
        name: 'Sectioned Workout',
        sections: [
          {
            name: 'Warmup',
            steps: [{ type: 'exercise', name: 'Stretch', duration: 60 }],
          },
          {
            name: 'Main',
            steps: [
              { type: 'exercise', name: 'Run', duration: 120 },
              { type: 'rest', duration: 30 },
            ],
          },
        ],
      };
      expect(calculateTotalWorkoutDuration(workout)).toBe(210);
    });

    it('should handle workouts with nested repetitions in sections', () => {
      const nestedSteps: (ExerciseStep | RestStep)[] = [
        { type: 'exercise', name: 'Burpees', duration: 20 },
      ];
      const repetition: RepetitionStep = {
        type: 'repetition',
        count: 2,
        steps: nestedSteps,
        restBetweenReps: 5,
      };
      const workout: Workout = {
        id: '3',
        name: 'Complex Workout',
        sections: [
          {
            name: 'Circuit',
            steps: [
              { type: 'exercise', name: 'Jumping Jacks', duration: 30 },
              repetition,
              { type: 'rest', duration: 10 },
            ],
          },
        ],
      };
      // Section: JJ (30) + (Burpees (20) * 2 + Rest (5)) + Rest (10) = 30 + 45 + 10 = 85
      expect(calculateTotalWorkoutDuration(workout)).toBe(85);
    });

    it('should return 0 for workout with no steps or sections', () => {
      const workout: Workout = { id: '4', name: 'Empty' };
      expect(calculateTotalWorkoutDuration(workout)).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format seconds into M:SS', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(60)).toBe('1:00');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(125)).toBe('2:05');
      expect(formatDuration(3600)).toBe('60:00');
    });
  });

  describe('formatTimeLeft', () => {
    it('should format seconds into ~X min', () => {
      expect(formatTimeLeft(0)).toBe('0 min');
      expect(formatTimeLeft(30)).toBe('1 min'); // Rounds up
      expect(formatTimeLeft(59)).toBe('1 min'); // Rounds up
      expect(formatTimeLeft(60)).toBe('1 min');
      expect(formatTimeLeft(61)).toBe('1 min'); // Rounds down
      expect(formatTimeLeft(90)).toBe('2 min');
      expect(formatTimeLeft(120)).toBe('2 min');
    });
  });
});
