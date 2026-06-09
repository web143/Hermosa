import { useEffect, useState } from "react";
import { LogOut, Settings, BarChart2, History, ChevronRight, Flame, Trophy, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { getRoutineForProfile, getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay } from "@/data/routines";
import { gymDb } from "@/db/olympusDb";
import type { WorkoutLog } from "@/db/olympusDb";
import type { Theme } from "@/App";

const dayCardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 },
  }),
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 28 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};

interface DashboardProps {
  profile: ProfileId;
  unit: "kg" | "lbs";
  theme: Theme;
  onToggleUnit: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onSelectDay: (day: RoutineDay) => void;
}

export default function Dashboard({ profile, unit, theme, onToggleUnit, onToggleTheme, onLogout, onSelectDay }: DashboardProps) {
  const isElla = profile === "ella";
  const isDark = theme === "dark";
  const routine = getRoutineForProfile(profile);

  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const loadHistory = async () => {
    try {
      const logs = await gymDb.getLogsByProfile(profile);
      setHistoryLogs(logs);
    } catch (e) {
      console.error("Error loading history", e);
    }
  };

  useEffect(() => {
    loadHistory();
    const handler = () => loadHistory();
    window.addEventListener("gym_db_update", handler);
    return () => window.removeEventListener("gym_db_update", handler);
  }, [profile]);

  const handleDeleteLog = async (id: number) => {
    if (confirm("¿Eliminar este registro del historial?")) {
      await gymDb.deleteWorkoutLog(id);
      loadHistory();
    }
  };

  const totalCompleted = historyLogs.length;
  const logsByDate = historyLogs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const profileName = isElla ? "HERMOSA" : "HANIEL";
  const profileGradient = isElla ? "from-pink-500 to-rose-600" : "from-amber-400 to-orange-500";

  // ── Theme-aware utility classes ─────────────────────────────────
  const bg       = isDark ? "bg-zinc-950"   : "bg-zinc-50";
  const navBg    = isDark ? "bg-zinc-950/90 border-zinc-900/80" : "bg-white/90 border-zinc-200";
  const cardBg   = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";
  const btnBg    = isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300";
  const textPrimary   = isDark ? "text-zinc-100"  : "text-zinc-900";
  const textSecondary = isDark ? "text-zinc-400"  : "text-zinc-500";
  const textMuted     = isDark ? "text-zinc-600"  : "text-zinc-400";

  return (
    <div className={`min-h-screen ${bg} ${textPrimary} flex flex-col`}>

      {/* ── Top Nav ──────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl safe-top ${navBg}`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${profileGradient} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-black">{profileName[0]}</span>
            </div>
            <div>
              <p className={`text-[10px] font-mono uppercase tracking-widest leading-none ${textMuted}`}>Perfil Activo</p>
              <p className={`text-sm font-black tracking-widest leading-tight ${textPrimary}`}>{profileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button id="unit-toggle-btn" onClick={onToggleUnit}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all active:scale-95 ${btnBg}`}>
              ⚖️ {unit.toUpperCase()}
            </button>
            <button id="history-btn" onClick={() => { setShowHistory(true); setShowSettings(false); }}
              className={`p-2 rounded-lg border transition-all active:scale-95 ${btnBg}`}>
              <History size={15} />
            </button>
            <button id="settings-btn" onClick={() => { setShowSettings(true); setShowHistory(false); }}
              className={`p-2 rounded-lg border transition-all active:scale-95 ${btnBg}`}>
              <Settings size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5 pb-24 overflow-y-auto">

        {/* Profile Hero Card */}
        <header className={`relative rounded-3xl overflow-hidden border ${cardBg}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${profileGradient} opacity-5`} />
          <div className="relative p-6">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${profileGradient} mb-3`}>
              <Flame size={11} className="text-white" />
              <span className="text-white text-[10px] font-black tracking-widest uppercase">
                {isElla ? "HERMOSA TRAINING" : "HANIEL TRAINING"}
              </span>
            </div>
            <h1 className={`text-4xl font-black tracking-tighter leading-none ${textPrimary}`}>
              Tu Rutina<br />Personal
            </h1>
            <p className={`text-sm mt-2 font-mono ${textSecondary}`}>
              4 días · Sistema de Sobrecarga Progresiva
            </p>

            <div className={`flex gap-4 mt-5 pt-4 border-t ${isDark ? "border-zinc-800/60" : "border-zinc-100"}`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${profileGradient} bg-opacity-10`}>
                  <Trophy size={13} className="text-white" />
                </div>
                <div>
                  <p className={`text-[10px] font-mono uppercase tracking-wider ${textMuted}`}>Sets Completados</p>
                  <p className={`text-base font-black ${textPrimary}`}>{totalCompleted}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${profileGradient} bg-opacity-10`}>
                  <BarChart2 size={13} className="text-white" />
                </div>
                <div>
                  <p className={`text-[10px] font-mono uppercase tracking-wider ${textMuted}`}>Días Entrenados</p>
                  <p className={`text-base font-black ${textPrimary}`}>{Object.keys(logsByDate).length}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Day Cards ──────────────────────────────────────────────────── */}
        <section>
          <h2 className={`text-xs font-bold tracking-widest uppercase mb-3 font-mono px-1 ${textMuted}`}>
            📋 TU RUTINA — {routine.length} DÍAS
          </h2>
          <div className="space-y-3">
            {routine.map((day, idx) => (
              <DayCard
                key={day.id}
                day={day}
                index={idx}
                isElla={isElla}
                isDark={isDark}
                onClick={() => onSelectDay(day)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
      {showHistory && (
        <HistoryModal
          logs={historyLogs}
          logsByDate={logsByDate}
          unit={unit}
          isDark={isDark}
          isElla={isElla}
          onClose={() => setShowHistory(false)}
          onDelete={handleDeleteLog}
        />
      )}
      {showSettings && (
        <SettingsModal
          isElla={isElla}
          isDark={isDark}
          unit={unit}
          theme={theme}
          onToggleUnit={onToggleUnit}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          onClose={() => setShowSettings(false)}
        />
      )}
      </AnimatePresence>
    </div>
  );
}

// ── DayCard ─────────────────────────────────────────────────────────────────
function DayCard({ day, index, isElla, isDark, onClick }: {
  day: RoutineDay; index: number; isElla: boolean; isDark: boolean; onClick: () => void;
}) {
  const imgSrc = getImageSrc(day.heroBg);
  const accentGradient = isElla ? "from-pink-600/70 to-rose-700/50" : "from-amber-500/70 to-orange-600/50";

  return (
    <motion.button
      id={`day-card-${index}`}
      onClick={onClick}
      variants={dayCardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-2xl overflow-hidden relative group shadow-sm ${
        isDark ? "shadow-black/30" : "shadow-zinc-200/80"
      }`}
      style={{ minHeight: "120px" }}
    >
      {/* Background */}
      <div className={`absolute inset-0 ${isDark ? "bg-zinc-900" : "bg-white border border-zinc-200"} rounded-2xl`} />

      {imgSrc && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          <img src={imgSrc} alt={day.title}
            className={`w-full h-full object-cover ${isDark ? "opacity-25 group-hover:opacity-35" : "opacity-10 group-hover:opacity-20"} transition-opacity duration-300`}
          />
        </div>
      )}

      {isDark
        ? <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-50 rounded-2xl`} />
        : <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-20 rounded-2xl`} />
      }
      <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? "from-zinc-950/90 via-zinc-950/50 to-transparent" : "from-white/95 via-white/70 to-transparent"} rounded-2xl`} />

      {/* Content */}
      <div className="relative p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {day.dayLabel}
            </span>
            <span className="text-lg leading-none">{day.emoji}</span>
          </div>
          <h3 className={`text-lg font-black leading-tight ${isDark ? "text-white" : "text-zinc-900"}`}>{day.title}</h3>
          <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{day.subtitle}</p>
          <div className="flex items-center gap-2 mt-2.5">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
              isDark ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/60" : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}>
              {day.exercises.length} ejercicios
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${
              isDark ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/60" : "bg-zinc-100 text-zinc-500 border-zinc-200"
            }`}>
              ⏱ {day.duration}
            </span>
          </div>
        </div>
        <ChevronRight size={22} className={`group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2 ${
          isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-300 group-hover:text-zinc-600"
        }`} />
      </div>
    </motion.button>
  );
}

// ── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({ logs, logsByDate, unit, isDark, isElla, onClose, onDelete }: {
  logs: WorkoutLog[]; logsByDate: Record<string, WorkoutLog[]>; unit: string;
  isDark: boolean; isElla: boolean; onClose: () => void; onDelete: (id: number) => void;
}) {
  const bg = isDark ? "bg-zinc-950" : "bg-white";
  const border = isDark ? "border-zinc-900" : "border-zinc-100";
  const cardBg = isDark ? "bg-zinc-900/60 border-zinc-800/60" : "bg-zinc-50 border-zinc-200";
  const text = isDark ? "text-zinc-100" : "text-zinc-900";
  const muted = isDark ? "text-zinc-500" : "text-zinc-400";
  const accent = isElla ? "text-pink-500" : "text-amber-500";

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`fixed inset-0 z-50 ${bg} backdrop-blur-xl flex flex-col`}
    >
      <div className={`flex items-center justify-between p-4 border-b ${border}`}>
        <h2 className={`font-black text-lg tracking-tight ${text}`}>📊 Historial</h2>
        <button onClick={onClose} className={`p-2 rounded-xl border text-sm font-bold ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"} active:scale-95 transition-all`}>✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 ? (
          <div className={`border-2 border-dashed rounded-2xl p-10 text-center ${isDark ? "border-zinc-800 text-zinc-600" : "border-zinc-200 text-zinc-400"} text-sm font-mono`}>
            <p className="text-3xl mb-3">📝</p>
            <p>Completa ejercicios para registrar tu historial aquí.</p>
          </div>
        ) : (
          Object.entries(logsByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5 ${muted}`}>
                📅 {new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="space-y-1">
                {dateLogs.map((log) => (
                  <div key={log.id} className={`border rounded-xl p-3 flex items-center justify-between ${cardBg}`}>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${text}`}>{log.exerciseName}</p>
                      <p className={`text-[11px] font-mono mt-0.5 ${muted}`}>
                        Top Set: <span className={`font-bold ${accent}`}>{log.topSetWeight || "—"} {log.unit || unit} × {log.topSetReps || "—"} reps</span>
                      </p>
                    </div>
                    <button onClick={() => log.id && onDelete(log.id)}
                      className="ml-3 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 active:scale-95 transition-all">🗑</button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({ isElla, isDark, unit, theme, onToggleUnit, onToggleTheme, onLogout, onClose }: {
  isElla: boolean; isDark: boolean; unit: string; theme: string;
  onToggleUnit: () => void; onToggleTheme: () => void; onLogout: () => void; onClose: () => void;
}) {
  const bg = isDark ? "bg-zinc-950" : "bg-white";
  const border = isDark ? "border-zinc-900" : "border-zinc-100";
  const cardBg = isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-zinc-50 border-zinc-200";
  const text = isDark ? "text-zinc-100" : "text-zinc-900";
  const muted = isDark ? "text-zinc-500" : "text-zinc-400";
  const accentGradient = isElla ? "from-pink-500 to-rose-600" : "from-amber-400 to-orange-500";

  return (
    <motion.div
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`fixed inset-0 z-50 ${bg} flex flex-col safe-bottom`}
    >
      <div className={`flex items-center justify-between p-4 border-b ${border}`}>
        <h2 className={`font-black text-lg tracking-tight ${text}`}>⚙️ Configuración</h2>
        <button onClick={onClose} className={`p-2 rounded-xl border text-sm font-bold ${isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"} active:scale-95 transition-all`}>✕</button>
      </div>

      <div className="flex-1 p-4 space-y-3">

        {/* ── Theme Toggle ─────────────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`font-semibold ${text}`}>Tema Visual</p>
            <p className={`text-xs mt-0.5 ${muted}`}>
              Activo: <span className="font-mono font-bold">{theme === "dark" ? "🌙 Modo Oscuro" : "☀️ Modo Claro"}</span>
            </p>
          </div>
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              isDark ? `bg-gradient-to-r ${accentGradient}` : "bg-zinc-200"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 flex items-center justify-center ${
              isDark ? "left-9" : "left-1"
            }`}>
              {isDark ? <Moon size={12} className="text-zinc-700" /> : <Sun size={12} className="text-amber-500" />}
            </div>
          </button>
        </div>

        {/* ── Unit Toggle ──────────────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-4 flex items-center justify-between ${cardBg}`}>
          <div>
            <p className={`font-semibold ${text}`}>Unidad de Peso</p>
            <p className={`text-xs mt-0.5 ${muted}`}>Activa: <span className="font-mono font-bold">{unit.toUpperCase()}</span></p>
          </div>
          <button
            id="settings-unit-toggle"
            onClick={onToggleUnit}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              unit === "lbs" ? `bg-gradient-to-r ${accentGradient}` : (isDark ? "bg-zinc-700" : "bg-zinc-200")
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${
              unit === "lbs" ? "left-9" : "left-1"
            }`} />
          </button>
        </div>

        {/* ── Profile info ─────────────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-4 ${cardBg}`}>
          <p className={`font-semibold mb-1 ${text}`}>Perfil Activo</p>
          <p className={`text-sm font-mono ${muted}`}>{isElla ? "HERMOSA — Rutina Femenina Completa" : "HANIEL — Sin rutina asignada"}</p>
        </div>

        {/* ── Logout ───────────────────────────────────────────────────────── */}
        <button
          id="change-profile-btn"
          onClick={onLogout}
          className={`w-full border rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98] ${
            isDark
              ? "bg-zinc-900/60 border-zinc-800 hover:border-red-900/60 hover:bg-red-950/10"
              : "bg-zinc-50 border-zinc-200 hover:border-red-200 hover:bg-red-50"
          }`}
        >
          <LogOut size={18} className="text-red-500" />
          <div className="text-left">
            <p className="font-semibold text-red-500">Cambiar de Perfil</p>
            <p className={`text-xs mt-0.5 ${muted}`}>Regresa a la pantalla de selección</p>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
