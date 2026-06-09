import { useState, useEffect } from "react";
import WelcomeScreen from "@/views/WelcomeScreen";
import Dashboard from "@/views/Dashboard";
import RoutineView from "@/views/RoutineView";
import ExerciseDetail from "@/views/ExerciseDetail";
import type { ProfileId } from "@/data/routines";
import type { RoutineDay, ExerciseConfig } from "@/data/routines";

export type TimerMode = "normal" | "fast";
export type Theme = "light" | "dark";

export default function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [view, setView] = useState<"welcome" | "dashboard" | "routine" | "exercise">("welcome");
  const [selectedDay, setSelectedDay] = useState<RoutineDay | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseConfig | null>(null);
  const [unit, setUnit] = useState<"kg" | "lbs">(
    (localStorage.getItem("gym_weight_unit") as "kg" | "lbs") || "kg"
  );
  const [timerMode, setTimerMode] = useState<TimerMode>("normal");
  // Theme: light by default
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem("gym_theme") as Theme) || "light"
  );

  // Restore session on load
  useEffect(() => {
    const saved = localStorage.getItem("gym_active_session") as ProfileId | null;
    if (saved === "haniel" || saved === "ella") {
      setProfile(saved);
      setView("dashboard");
    }
  }, []);

  const handleSelectProfile = (p: ProfileId) => {
    setProfile(p);
    localStorage.setItem("gym_active_session", p);
    setView("dashboard");
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem("gym_active_session");
    setView("welcome");
    setSelectedDay(null);
    setSelectedExercise(null);
  };

  const handleToggleUnit = () => {
    const next = unit === "kg" ? "lbs" : "kg";
    setUnit(next);
    localStorage.setItem("gym_weight_unit", next);
  };

  const handleToggleTheme = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("gym_theme", next);
  };

  const handleSelectDay = (day: RoutineDay) => {
    setSelectedDay(day);
    setView("routine");
  };

  const handleSelectExercise = (exercise: ExerciseConfig) => {
    setSelectedExercise(exercise);
    setView("exercise");
  };

  const handleBackToDashboard = () => {
    setSelectedDay(null);
    setView("dashboard");
  };

  const handleBackToRoutine = () => {
    setSelectedExercise(null);
    setView("routine");
  };

  return (
    <div
      className={`w-full min-h-screen font-sans antialiased overflow-hidden ${
        theme === "dark"
          ? "dark bg-zinc-950 text-zinc-100"
          : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {view === "welcome" && (
        <WelcomeScreen
          theme={theme}
          onSelectProfile={handleSelectProfile}
        />
      )}
      {view === "dashboard" && profile && (
        <Dashboard
          profile={profile}
          unit={unit}
          theme={theme}
          onToggleUnit={handleToggleUnit}
          onToggleTheme={handleToggleTheme}
          onLogout={handleLogout}
          onSelectDay={handleSelectDay}
        />
      )}
      {view === "routine" && profile && selectedDay && (
        <RoutineView
          profile={profile}
          day={selectedDay}
          unit={unit}
          theme={theme}
          timerMode={timerMode}
          onTimerModeChange={setTimerMode}
          onBack={handleBackToDashboard}
          onSelectExercise={handleSelectExercise}
        />
      )}
      {view === "exercise" && profile && selectedDay && selectedExercise && (
        <ExerciseDetail
          profile={profile}
          day={selectedDay}
          exercise={selectedExercise}
          unit={unit}
          theme={theme}
          timerMode={timerMode}
          onBack={handleBackToRoutine}
        />
      )}
    </div>
  );
}
