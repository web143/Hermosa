import { Sun, Moon, LogOut, Weight } from "lucide-react";

interface SettingsViewProps {
  theme: "light" | "dark";
  unit: "kg" | "lbs";
  isElla: boolean;
  onToggleTheme: () => void;
  onToggleUnit: () => void;
  onLogout: () => void;
}

export default function SettingsView({
  theme, unit, isElla, onToggleTheme, onToggleUnit, onLogout,
}: SettingsViewProps) {
  const isDark = theme === "dark";
  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";
  const accentGradient = isElla ? "from-pink-500 to-rose-600" : "from-amber-400 to-orange-500";

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-4 overflow-y-auto">

        <h2 className={`text-xs font-mono font-bold uppercase tracking-widest ${textMuted} px-1`}>
          ⚙️ Configuración
        </h2>

        {/* Theme Toggle */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            }`}>
              {isDark ? <Moon size={16} className="text-zinc-300" /> : <Sun size={16} className="text-amber-500" />}
            </div>
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>Tema Visual</p>
              <p className={`text-[10px] font-mono ${textMuted}`}>{isDark ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}</p>
            </div>
          </div>
          <button
            id="settings-theme-toggle"
            onClick={onToggleTheme}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              isDark ? `bg-gradient-to-r ${accentGradient}` : "bg-zinc-200"
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 flex items-center justify-center ${
              isDark ? "left-7" : "left-0.5"
            }`}>
              {isDark ? <Moon size={10} className="text-zinc-700" /> : <Sun size={10} className="text-amber-500" />}
            </div>
          </button>
        </div>

        {/* Unit Toggle */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            }`}>
              <Weight size={16} className={isDark ? "text-zinc-300" : "text-zinc-600"} />
            </div>
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>Unidad de Peso</p>
              <p className={`text-[10px] font-mono ${textMuted}`}>
                Activo: <span className="font-bold">{unit.toUpperCase()}</span>
              </p>
            </div>
          </div>
          <button
            id="settings-unit-toggle"
            onClick={onToggleUnit}
            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
              unit === "lbs" ? `bg-gradient-to-r ${accentGradient}` : (isDark ? "bg-zinc-700" : "bg-zinc-200")
            }`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 flex items-center justify-center ${
              unit === "lbs" ? "left-7" : "left-0.5"
            }`}>
              <span className="text-[8px] font-black">{unit === "lbs" ? "LBS" : "KG"}</span>
            </div>
          </button>
        </div>

        {/* Profile Info */}
        <div className={`border rounded-2xl p-4 ${cardBg}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            }`}>
              <span className={`text-sm font-black ${isDark ? "text-zinc-300" : "text-zinc-600"}`}>
                {isElla ? "H" : "H"}
              </span>
            </div>
            <div>
              <p className={`text-sm font-semibold ${textPrimary}`}>Perfil Activo</p>
              <p className={`text-[10px] font-mono ${textMuted}`}>
                {isElla ? "HERMOSA — Rutina Femenina Completa" : "HANIEL — Sin rutina asignada"}
              </p>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="settings-logout-btn"
          onClick={onLogout}
          className={`w-full border rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] ${
            isDark
              ? "bg-zinc-900/60 border-zinc-800 hover:border-red-900/60 hover:bg-red-950/10"
              : "bg-zinc-50 border-zinc-200 hover:border-red-200 hover:bg-red-50"
          }`}
        >
          <LogOut size={18} className="text-red-500" />
          <div className="text-left">
            <p className="text-sm font-semibold text-red-500">Cambiar de Perfil</p>
            <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>Regresa a la pantalla de selección</p>
          </div>
        </button>
      </div>
    </div>
  );
}
