import { useState, useEffect } from "react";
import WelcomeScreen from "@/views/WelcomeScreen";
import Dashboard from "@/views/Dashboard";

function App() {
  const [profile, setProfile] = useState<"haniel" | "novia" | null>(null);

  // Restore profile state from localStorage on load
  useEffect(() => {
    const savedProfile = localStorage.getItem("olympus_active_profile");
    if (savedProfile === "haniel" || savedProfile === "novia") {
      setProfile(savedProfile);
    }
  }, []);

  const handleSelectProfile = (selectedProfile: "haniel" | "novia") => {
    setProfile(selectedProfile);
    localStorage.setItem("olympus_active_profile", selectedProfile);
  };

  const handleLogout = () => {
    setProfile(null);
    localStorage.removeItem("olympus_active_profile");
  };

  return (
    <div className="w-full min-h-screen bg-zinc-950 font-sans antialiased text-zinc-100">
      {profile === null ? (
        <WelcomeScreen onSelectProfile={handleSelectProfile} />
      ) : (
        <Dashboard profile={profile} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
