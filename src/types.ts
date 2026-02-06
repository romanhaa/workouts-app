// src/types.ts

export interface BaseStep {
  type: 'exercise' | 'rest' | 'repetition';
}

export interface ExerciseStep extends BaseStep {
  type: 'exercise';
  name: string;
  duration: number; // in seconds
  description?: string;
}

export interface RestStep extends BaseStep {
  type: 'rest';
  duration: number; // in seconds
}

export interface RepetitionStep extends BaseStep {
  type: 'repetition';
  count: number;
  steps: RunnabaleWorkoutStep[];
  restBetweenReps?: number; // New: Optional rest period between repetitions in seconds
}

export type RunnableStep = ExerciseStep | RestStep;
export type RunnabaleWorkoutStep = RunnableStep | RepetitionStep;

export interface WorkoutSection {
  name: string;
  steps: RunnabaleWorkoutStep[];
}

export interface Workout {
  id: string;
  name: string;
  steps?: RunnabaleWorkoutStep[]; // Make optional
  sections?: WorkoutSection[]; // New: Optional sections
  muscleGroups?: string[];
}

export interface WorkoutData {
  workouts: Workout[];
}
