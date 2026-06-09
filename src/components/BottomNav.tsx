import { Home, Dumbbell, BarChart3, Settings } from "lucide-react";

export type TabId = "home" | "workout" | "analytics" | "settings";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Inicio", icon: Home },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Ajustes", icon: Settings },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-t border-zinc-200 dark:border-zinc-800 safe-bottom pb-safe">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`nav-${id}`}
              onClick={() => onTabChange(id)}
              className={`flex flex-col items-center justify-center gap-0.5 w-16 h-full transition-colors ${
                isActive
                  ? "text-pink-500 dark:text-pink-400"
                  : "text-zinc-400 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[9px] font-mono font-bold tracking-wider uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
