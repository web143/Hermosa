import { useState, useEffect } from "react";
import WelcomeScreen from "@/views/WelcomeScreen";
import HomeView from "@/views/HomeView";
import WorkoutView from "@/views/WorkoutView";
import AnalyticsView from "@/views/AnalyticsView";
import SettingsView from "@/views/SettingsView";
import BottomNav from "@/components/BottomNav";
import type { TabId } from "@/components/BottomNav";
import type { ProfileId } from "@/data/routines";

export type TimerMode = "normal" | "fast";
export type Theme = "light" | "dark";

export default function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [unit, setUnit] = useState<"kg" | "lbs">(
    (localStorage.getItem("gym_weight_unit") as "kg" | "lbs") || "kg"
  );
  const [timerMode, setTimerMode] = useState<TimerMode>("normal");
  const [theme, setTheme] = useState<Theme>(
    (localStorage.getItem("gym_theme") as Theme) || "light"
  );

  // Restore session on load
  useEffect(() => {
    const saved = localStorage.getItem("gym_active_session") as ProfileId | null;
    if (saved === "haniel" || saved === "ella") {
      setProfile(saved);
    }
  }, []);

  const handleSelectProfile = (p: ProfileId) => {
    setProfile(p);
    localStorage.setItem("gym_active_session", p);
    setTab("home");
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem("gym_active_session");
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

  const handleTabChange = (newTab: TabId) => {
    setTab(newTab);
  };

  const showNav = profile !== null;

  return (
    <div
      className={`w-full min-h-screen font-sans antialiased overflow-hidden ${
        theme === "dark"
          ? "dark bg-zinc-950 text-zinc-100"
          : "bg-zinc-50 text-zinc-900"
      }`}
    >
      {!profile && (
        <WelcomeScreen
          theme={theme}
          onSelectProfile={handleSelectProfile}
        />
      )}

      {/* Main tab content — only when logged in */}
      {profile && (
        <div className={`${showNav ? "pb-16" : ""}`}>
          {tab === "home" ? (
            <HomeView
              profile={profile}
              theme={theme}
            />
          ) : tab === "workout" ? (
            <WorkoutView
              profile={profile}
              theme={theme}
              timerMode={timerMode}
              onTimerModeChange={setTimerMode}
              onNavigateToTab={handleTabChange}
              unit={unit}
            />
          ) : tab === "analytics" ? (
            <AnalyticsView
              profile={profile}
              theme={theme}
            />
          ) : (
            <SettingsView
              theme={theme}
              unit={unit}
              isElla={profile === "ella"}
              onToggleTheme={handleToggleTheme}
              onToggleUnit={handleToggleUnit}
              onLogout={handleLogout}
            />
          )}
        </div>
      )}

      {/* Bottom Navigation */}
      {profile && (
        <BottomNav
          activeTab={tab}
          onTabChange={handleTabChange}
        />
      )}
    </div>
  );
}
