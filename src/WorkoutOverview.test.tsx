// src/WorkoutOverview.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import WorkoutOverview from './WorkoutOverview';
import type { Workout, RepetitionStep } from './types';

// Mock formatDuration as it's passed as a prop
const mockFormatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

describe('WorkoutOverview', () => {
  it('should render workout name, total duration, and simple steps correctly', () => {
    const workout: Workout = {
      id: 'test1',
      name: 'Basic Workout',
      steps: [
        { type: 'exercise', name: 'Pushups', duration: 30, description: 'Keep good form.' },
        { type: 'rest', duration: 10 },
      ],
      muscleGroups: ['Chest', 'Triceps'],
    };

    render(
      <WorkoutOverview
        workout={workout}
        onStart={() => {}}
        onBack={() => {}}
        formatDuration={mockFormatDuration}
      />
    );

    expect(screen.getByText('Basic Workout')).toBeInTheDocument();
    expect(screen.getByText('Total Duration: 0m 40s min')).toBeInTheDocument();
    expect(screen.getByText('Chest')).toBeInTheDocument();
    expect(screen.getByText('Triceps')).toBeInTheDocument();

    // Check steps
    expect(screen.getByText('Pushups')).toBeInTheDocument();
    expect(screen.getByText('Keep good form.')).toBeInTheDocument();
    expect(screen.getByText('0m 30s')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
    expect(screen.getByText('0m 10s')).toBeInTheDocument();
  });

  it('should render workout with sections correctly', () => {
    const workout: Workout = {
      id: 'test2',
      name: 'Sectioned Workout',
      sections: [
        {
          name: 'Warmup',
          steps: [{ type: 'exercise', name: 'Jumping Jacks', duration: 60 }],
        },
        {
          name: 'Main',
          steps: [
            { type: 'exercise', name: 'Squats', duration: 90 },
            { type: 'rest', duration: 30 },
          ],
        },
      ],
    };

    render(
      <WorkoutOverview
        workout={workout}
        onStart={() => {}}
        onBack={() => {}}
        formatDuration={mockFormatDuration}
      />
    );

    expect(screen.getByText('Sectioned Workout')).toBeInTheDocument();
    expect(screen.getByText('Total Duration: 3m 0s min')).toBeInTheDocument();

    // Check sections and their durations
    expect(screen.getByRole('heading', { name: /Warmup \(1m 0s\)/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Jumping Jacks')).toBeInTheDocument();
    expect(screen.getByText('1m 0s')).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Main \(2m 0s\)/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText('Squats')).toBeInTheDocument();
    expect(screen.getByText('1m 30s')).toBeInTheDocument();
    expect(screen.getByText('Rest')).toBeInTheDocument();
    expect(screen.getByText('0m 30s')).toBeInTheDocument();
  });

  it('should render workout with repetition steps correctly', () => {
    const repetition: RepetitionStep = {
      type: 'repetition',
      count: 2,
      steps: [
        { type: 'exercise', name: 'Lunges', duration: 40 },
        { type: 'rest', duration: 10 },
      ],
      restBetweenReps: 5,
    };
    const workout: Workout = {
      id: 'test3',
      name: 'Repetition Workout',
      steps: [
        { type: 'exercise', name: 'Intro', duration: 10 },
        repetition,
      ],
    };
    // Repetition calculation: (Lunges (40) + Rest (10)) * 2 + RestBetweenReps (5 * (2-1)) = (50 * 2) + 5 = 105
    // Total workout duration: Intro (10) + Repetition (105) = 115

    render(
      <WorkoutOverview
        workout={workout}
        onStart={() => {}}
        onBack={() => {}}
        formatDuration={mockFormatDuration}
      />
    );

    expect(screen.getByText('Repetition Workout')).toBeInTheDocument();
    expect(screen.getByText('Total Duration: 1m 55s min')).toBeInTheDocument(); // 115 seconds

    const introElement = screen.getByText('Intro');
    const introParent = introElement.closest('.step') as HTMLElement; // Cast to HTMLElement for within
    expect(introParent).toBeInTheDocument();
    expect(within(introParent).getByText('0m 10s')).toBeInTheDocument();

    // Check repetition block
    const repetitionHeaderElement = screen.getByText(/Repeat 2 times/i).parentElement as HTMLElement;
    expect(repetitionHeaderElement).toBeInTheDocument();
    const lungesElements = screen.getAllByText('Lunges');
    expect(lungesElements.length).toBe(1); // Rendered once
    const restElements = screen.getAllByText(RegExp('^Rest'));
    expect(restElements.length).toBe(2); // One after lunge, plus rest between reps

    expect(screen.getByText('Rest: 0m 5s')).toBeInTheDocument(); // Rest between reps
  });

  it('should call onStart when Start Workout button is clicked', () => {
    const onStartMock = vi.fn();
    const workout: Workout = { id: 'test4', name: 'Click Test', steps: [] };

    render(
      <WorkoutOverview
        workout={workout}
        onStart={onStartMock}
        onBack={() => {}}
        formatDuration={mockFormatDuration}
      />
    );

    screen.getByRole('button', { name: /start workout/i }).click();
    expect(onStartMock).toHaveBeenCalledTimes(1);
  });

  it('should call onBack when Back button is clicked', () => {
    const onBackMock = vi.fn();
    const workout: Workout = { id: 'test5', name: 'Click Test', steps: [] };

    render(
      <WorkoutOverview
        workout={workout}
        onStart={() => {}}
        onBack={onBackMock}
        formatDuration={mockFormatDuration}
      />
    );

    screen.getByRole('button', { name: /back/i }).click();
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });
});
