import { Dumbbell, Home } from "lucide-react";

interface WorkoutViewProps {
  theme: "light" | "dark";
  onNavigateHome: () => void;
}

export default function WorkoutView({ theme, onNavigateHome }: WorkoutViewProps) {
  const isDark = theme === "dark";

  return (
    <div className={`min-h-full flex flex-col items-center justify-center px-6 pb-16 ${
      isDark ? "bg-zinc-950 text-zinc-400" : "bg-zinc-50 text-zinc-400"
    }`}>
      <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${
        isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"
      }`}>
        <Dumbbell size={32} className="text-zinc-400" />
      </div>
      <h2 className={`text-xl font-black tracking-tight mb-2 ${
        isDark ? "text-zinc-200" : "text-zinc-700"
      }`}>
        Sin entrenamiento activo
      </h2>
      <p className={`text-sm font-mono text-center max-w-xs mb-8 ${
        isDark ? "text-zinc-600" : "text-zinc-400"
      }`}>
        Selecciona un día de tu rutina en la pestaña Inicio para comenzar tu entrenamiento.
      </p>
      <button
        id="go-home-from-workout"
        onClick={onNavigateHome}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
          isDark
            ? "bg-pink-500/10 border border-pink-500/30 text-pink-400 hover:bg-pink-500/20"
            : "bg-pink-50 border border-pink-200 text-pink-600 hover:bg-pink-100"
        }`}
      >
        <Home size={16} />
        Ir a Inicio
      </button>
    </div>
  );
}
