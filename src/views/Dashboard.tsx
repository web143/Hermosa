import { useEffect, useState } from "react";
import { LogOut, Settings, BarChart2, History, ChevronRight, Flame, Trophy } from "lucide-react";
import { getRoutineForProfile, getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay } from "@/data/routines";
import { gymDb } from "@/db/olympusDb";
import type { WorkoutLog } from "@/db/olympusDb";

interface DashboardProps {
  profile: ProfileId;
  unit: "kg" | "lbs";
  onToggleUnit: () => void;
  onLogout: () => void;
  onSelectDay: (day: RoutineDay) => void;
}

export default function Dashboard({ profile, unit, onToggleUnit, onLogout, onSelectDay }: DashboardProps) {
  const isElla = profile === "ella";
  const accentColor = isElla ? "pink" : "amber";
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

  // Group logs by date
  const logsByDate = historyLogs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    if (!acc[log.date]) acc[log.date] = [];
    acc[log.date].push(log);
    return acc;
  }, {});

  const profileName = isElla ? "HERMOSA" : "HANIEL";
  const profileColor = isElla
    ? "from-pink-600 to-rose-700"
    : "from-amber-500 to-orange-600";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* ─── Top Navigation Bar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-zinc-900/80 bg-zinc-950/90 backdrop-blur-xl safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${profileColor} flex items-center justify-center`}>
              <span className="text-white text-[10px] font-black">{profileName[0]}</span>
            </div>
            <div>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">Perfil Activo</p>
              <p className="text-sm font-black tracking-widest text-zinc-100 leading-tight">{profileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Unit Toggle */}
            <button
              id="unit-toggle-btn"
              onClick={onToggleUnit}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono font-bold text-zinc-300 hover:text-white hover:border-zinc-600 transition-all active:scale-95"
            >
              ⚖️ {unit.toUpperCase()}
            </button>

            {/* History */}
            <button
              id="history-btn"
              onClick={() => { setShowHistory(true); setShowSettings(false); }}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all active:scale-95"
            >
              <History size={15} />
            </button>

            {/* Settings / Logout */}
            <button
              id="settings-btn"
              onClick={() => { setShowSettings(true); setShowHistory(false); }}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 transition-all active:scale-95"
            >
              <Settings size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* ─── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-5 pb-24 overflow-y-auto">

        {/* Profile Hero Card */}
        <header className="relative rounded-3xl overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${profileColor} opacity-10`} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="relative p-6">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${profileColor} mb-3`}>
              <Flame size={11} className="text-white" />
              <span className="text-white text-[10px] font-black tracking-widest uppercase">
                {isElla ? "HERMOSA TRAINING" : "HANIEL TRAINING"}
              </span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none">
              {isElla ? "Tu Rutina\nPersonal" : "Tu Rutina\nPersonal"}
            </h1>
            <p className="text-zinc-400 text-sm mt-2 font-mono">
              4 días de entrenamiento · Sistema de Sobrecarga Progresiva
            </p>

            {/* Quick Stats */}
            <div className="flex gap-4 mt-5 pt-4 border-t border-zinc-800/60">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${profileColor} bg-opacity-20`}>
                  <Trophy size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Sets Completados</p>
                  <p className="text-base font-black text-zinc-100">{totalCompleted}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${profileColor} bg-opacity-20`}>
                  <BarChart2 size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Días Entrenados</p>
                  <p className="text-base font-black text-zinc-100">{Object.keys(logsByDate).length}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Routine Day Cards ──────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-3 font-mono px-1">
            📋 TU RUTINA — {routine.length} DÍAS
          </h2>

          <div className="space-y-3">
            {routine.map((day, idx) => (
              <DayCard
                key={day.id}
                day={day}
                index={idx}
                accentColor={accentColor}
                isElla={isElla}
                onClick={() => onSelectDay(day)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ─── History Modal ────────────────────────────────────────────────────── */}
      {showHistory && (
        <HistoryModal
          logs={historyLogs}
          logsByDate={logsByDate}
          unit={unit}
          onClose={() => setShowHistory(false)}
          onDelete={handleDeleteLog}
          isElla={isElla}
        />
      )}

      {/* ─── Settings Modal ───────────────────────────────────────────────────── */}
      {showSettings && (
        <SettingsModal
          isElla={isElla}
          unit={unit}
          onToggleUnit={onToggleUnit}
          onLogout={onLogout}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

// ─── DayCard Component ─────────────────────────────────────────────────────────
function DayCard({
  day, index, accentColor, isElla, onClick
}: {
  day: RoutineDay;
  index: number;
  accentColor: string;
  isElla: boolean;
  onClick: () => void;
}) {
  const imgSrc = getImageSrc(day.heroBg);
  const accentGradient = isElla
    ? "from-pink-600/80 to-rose-700/60"
    : "from-amber-500/80 to-orange-600/60";

  return (
    <button
      id={`day-card-${index}`}
      onClick={onClick}
      className="w-full text-left rounded-2xl overflow-hidden relative group active:scale-[0.98] transition-transform duration-150 shadow-xl"
      style={{ minHeight: "120px" }}
    >
      {/* Background image */}
      {imgSrc && (
        <div className="absolute inset-0">
          <img
            src={imgSrc}
            alt={day.title}
            className="w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300"
          />
        </div>
      )}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-60`} />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />

      {/* Content */}
      <div className="relative p-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
              {day.dayLabel}
            </span>
            <span className="text-lg leading-none">{day.emoji}</span>
          </div>
          <h3 className="text-lg font-black text-white leading-tight">{day.title}</h3>
          <p className="text-xs text-zinc-400 mt-1">{day.subtitle}</p>

          {/* Meta chips */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[10px] bg-zinc-800/80 backdrop-blur text-zinc-400 px-2 py-0.5 rounded-full font-mono border border-zinc-700/60">
              {day.exercises.length} ejercicios
            </span>
            <span className="text-[10px] bg-zinc-800/80 backdrop-blur text-zinc-400 px-2 py-0.5 rounded-full font-mono border border-zinc-700/60">
              ⏱ {day.duration}
            </span>
          </div>
        </div>

        <ChevronRight size={22} className="text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2" />
      </div>
    </button>
  );
}

// ─── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({
  logs, logsByDate, unit, onClose, onDelete, isElla
}: {
  logs: WorkoutLog[];
  logsByDate: Record<string, WorkoutLog[]>;
  unit: "kg" | "lbs";
  onClose: () => void;
  onDelete: (id: number) => void;
  isElla: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col animate-slide-up">
      <div className="flex items-center justify-between p-4 border-b border-zinc-900">
        <h2 className="font-black text-lg tracking-tight">📊 Historial de Entrenamientos</h2>
        <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white active:scale-95 transition-all">
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {logs.length === 0 ? (
          <div className="border border-dashed border-zinc-800 rounded-2xl p-10 text-center text-zinc-600 text-sm font-mono">
            <p className="text-3xl mb-3">📝</p>
            <p>Completa ejercicios para registrar tu historial aquí.</p>
          </div>
        ) : (
          Object.entries(logsByDate).map(([date, dateLogs]) => (
            <div key={date}>
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5">
                📅 {new Date(date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </p>
              <div className="space-y-1">
                {dateLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-100 truncate">{log.exerciseName}</p>
                      <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                        Top Set: <span className={`font-bold ${isElla ? "text-pink-400" : "text-amber-400"}`}>{log.topSetWeight || "—"} {log.unit || unit} × {log.topSetReps || "—"} reps</span>
                        {log.set3Weight && <> · Back-offs: {log.set3Weight} / {log.set4Weight}</>}
                      </p>
                    </div>
                    <button
                      onClick={() => log.id && onDelete(log.id)}
                      className="ml-3 p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-950/30 transition-all active:scale-95 flex-shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Settings Modal ────────────────────────────────────────────────────────────
function SettingsModal({
  isElla, unit, onToggleUnit, onLogout, onClose
}: {
  isElla: boolean;
  unit: "kg" | "lbs";
  onToggleUnit: () => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-xl flex flex-col animate-slide-up safe-bottom">
      <div className="flex items-center justify-between p-4 border-b border-zinc-900">
        <h2 className="font-black text-lg tracking-tight">⚙️ Configuración</h2>
        <button onClick={onClose} className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white active:scale-95 transition-all">
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {/* Unit toggle */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-zinc-100">Unidad de Peso</p>
            <p className="text-xs text-zinc-500 mt-0.5">Activa: <span className="font-mono font-bold text-zinc-300">{unit.toUpperCase()}</span></p>
          </div>
          <button
            id="settings-unit-toggle"
            onClick={onToggleUnit}
            className={`relative w-16 h-8 rounded-full transition-all duration-300 ${
              unit === "lbs" ? (isElla ? "bg-pink-500" : "bg-amber-500") : "bg-zinc-700"
            }`}
          >
            <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all duration-300 ${
              unit === "lbs" ? "left-9" : "left-1"
            }`} />
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white/80 pointer-events-none">
              {unit === "lbs" ? "LBS" : " KG"}
            </span>
          </button>
        </div>

        {/* Profile info */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4">
          <p className="font-semibold text-zinc-100 mb-1">Perfil Activo</p>
          <p className="text-sm text-zinc-400 font-mono">{isElla ? "HERMOSA — Rutina Femenina" : "HANIEL — Sin rutina asignada"}</p>
        </div>

        {/* Change profile */}
        <button
          id="change-profile-btn"
          onClick={onLogout}
          className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-red-900/60 hover:bg-red-950/10 rounded-2xl p-4 flex items-center gap-3 transition-all active:scale-[0.98]"
        >
          <LogOut size={18} className="text-red-400" />
          <div className="text-left">
            <p className="font-semibold text-red-400">Cambiar de Perfil</p>
            <p className="text-xs text-zinc-600 mt-0.5">Regresa a la pantalla de selección</p>
          </div>
        </button>
      </div>
    </div>
  );
}
