// src/App.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from './App';
import type { WorkoutData } from './types';
import WorkoutOverview from './WorkoutOverview'; // Import the mocked component
import WorkoutRunner from './WorkoutRunner';     // Import the mocked component
import WorkoutFinished from './WorkoutFinished'; // Import the mocked component

// Mock child components to simplify testing App's routing logic
vi.mock('./WorkoutOverview', () => ({
  default: vi.fn(({ workout, onStart, onBack }) => (
    <div data-testid="workout-overview">
      <h2 data-testid="overview-workout-name">{workout.name}</h2>
      <button onClick={onStart}>Start Workout</button>
      <button onClick={onBack}>Back</button>
    </div>
  )),
}));

vi.mock('./WorkoutRunner', () => ({
  default: vi.fn(({ workout, onFinish, onEnd }) => (
    <div data-testid="workout-runner">
      <h2 data-testid="runner-workout-name">{workout.name}</h2>
      <button onClick={onFinish}>Finish Workout</button>
      <button onClick={() => {
        if (window.confirm('Are you sure you want to end the workout?')) {
          onEnd();
        }
      }}>End Workout</button>
    </div>
  )),
}));

vi.mock('./WorkoutFinished', () => ({
  default: vi.fn(({ onBackToWorkouts }) => (
    <div data-testid="workout-finished">
      <h2>Workout Finished!</h2>
      <button onClick={onBackToWorkouts}>Back to Workouts</button>
    </div>
  )),
}));

// Mock the calculateTotalWorkoutDuration and formatDuration from utils.ts
vi.mock('./utils', () => ({
  calculateTotalWorkoutDuration: vi.fn((workout) => (workout.steps?.length || workout.sections?.length || 0) * 10), // Mocked duration
  formatDuration: vi.fn((seconds) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`),
}));


const mockWorkouts: WorkoutData = {
  workouts: [
    { id: 'workout-1', name: 'Workout One', steps: [] },
    { id: 'workout-2', name: 'Workout Two', sections: [] },
    { id: 'test-workout-1', name: 'Test Workout One', steps: [] },
    { id: 'test-2', name: 'Test Workout Two', sections: [] },
  ],
};

describe('App', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    // Mock fetch API
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockWorkouts),
      }) as Promise<Response>
    );
    // Reset mocks for child components
    (WorkoutOverview as unknown as MockInstance).mockClear();
    (WorkoutRunner as unknown as MockInstance).mockClear();
    (WorkoutFinished as unknown as MockInstance).mockClear();
  });

  afterEach(() => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    // Clean up DOM after each test
    cleanup();
  });

  it('should render initial selection screen and fetch workouts', async () => {
    render(<App />);

    expect(screen.getByText('Select a Workout')).toBeInTheDocument();
    expect(globalThis.fetch).toHaveBeenCalledWith('/workouts-app/workouts.json');

    await waitFor(() => {
      expect(screen.getByText('Workout One')).toBeInTheDocument();
      expect(screen.getByText('Workout Two')).toBeInTheDocument();
      expect(screen.getByText('Test Workout One')).toBeInTheDocument();
      expect(screen.getByText('Test Workout Two')).toBeInTheDocument();
    });
  });

  it('should display WorkoutOverview when a workout is selected', async () => {
    render(<App />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Workout One'));
    });

    expect(screen.getByTestId('workout-overview')).toBeInTheDocument();
    expect(screen.getByTestId('overview-workout-name')).toHaveTextContent('Workout One');
  });

  it('should display WorkoutRunner when "Start Workout" is clicked from overview', async () => {
    render(<App />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Workout One'));
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('Start Workout'));
    });

    expect(screen.getByTestId('workout-runner')).toBeInTheDocument();
    expect(screen.getByTestId('runner-workout-name')).toHaveTextContent('Workout One');
  });

  it('should display WorkoutFinished when "Finish Workout" is clicked from runner', async () => {
    render(<App />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Workout One'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start Workout'));
    });

    fireEvent.click(screen.getByText('Finish Workout'));

    expect(screen.getByTestId('workout-finished')).toBeInTheDocument();
  });

  it('should go back to selection screen from WorkoutOverview', async () => {
    render(<App />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Workout One'));
    });
    fireEvent.click(screen.getByText('Back'));

    expect(screen.getByText('Select a Workout')).toBeInTheDocument();
  });

  it('should go back to selection screen from WorkoutRunner on "End Workout"', async () => {
    render(<App />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Workout One'));
    });
    await waitFor(() => {
      fireEvent.click(screen.getByText('Start Workout'));
    });

    // Mock window.confirm BEFORE the click that triggers it
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValue(true);

    fireEvent.click(screen.getByText('End Workout')); // This triggers window.confirm

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Select a Workout')).toBeInTheDocument();

    confirmSpy.mockRestore(); // Restore original confirm
  });
});
