// src/App.tsx

import { useState, useEffect } from 'react';
import type { Workout, WorkoutData } from './types';
import WorkoutRunner from './WorkoutRunner';
import './App.css';
import './WorkoutRunner.css';

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    fetch('/workouts.json')
      .then((response) => response.json())
      .then((data: WorkoutData) => setWorkouts(data.workouts))
      .catch((error) => console.error('Error fetching workouts:', error));
  }, []);

  if (selectedWorkout) {
    return (
      <div className="App">
        <WorkoutRunner
          workout={selectedWorkout}
          onFinish={() => setSelectedWorkout(null)}
        />
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Select a Workout</h1>
      </header>
      <div className="workout-list">
        {workouts.map((workout) => (
          <button key={workout.id} onClick={() => setSelectedWorkout(workout)}>
            {workout.name}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;