import { ArrowLeft, Heart, ChevronRight, Zap, Clock } from "lucide-react";
import { getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay, ExerciseConfig } from "@/data/routines";
import type { TimerMode } from "@/App";

interface RoutineViewProps {
  profile: ProfileId;
  day: RoutineDay;
  unit: "kg" | "lbs";
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseConfig) => void;
}

export default function RoutineView({
  profile,
  day,
  timerMode,
  onTimerModeChange,
  onBack,
  onSelectExercise,
}: RoutineViewProps) {
  const isElla = profile === "ella";
  const heroBg = getImageSrc(day.heroBg);
  const normalDuration = day.exercises.length * 8; // ~8 min per exercise estimate
  const fastDuration = day.exercises.length * 5;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">

      {/* ─── Hero Background ──────────────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {heroBg && (
          <img
            src={heroBg}
            alt={day.title}
            className="w-full h-full object-cover object-center"
            style={{ filter: "blur(2px)", transform: "scale(1.06)" }}
          />
        )}
        {/* Deep gradient overlay — cinematic dark */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-zinc-950/30" />
        <div className="absolute inset-0 bg-zinc-950/40" />
      </div>

      {/* ─── Floating Header ──────────────────────────────────────────────────── */}
      <header className="relative z-20 safe-top">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          {/* Back button */}
          <button
            id="routine-back-btn"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 flex items-center justify-center text-zinc-300 hover:text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Timer mode selector — pill */}
          <div className="flex items-center bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 rounded-2xl p-1 gap-1">
            <button
              id="timer-normal-btn"
              onClick={() => onTimerModeChange("normal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                timerMode === "normal"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Clock size={11} />
              {normalDuration} min
            </button>
            <button
              id="timer-fast-btn"
              onClick={() => onTimerModeChange("fast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                timerMode === "fast"
                  ? "bg-white text-zinc-950 shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Zap size={11} />
              {fastDuration} min
            </button>
          </div>

          {/* Favorites */}
          <button className="w-10 h-10 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-zinc-800/60 flex items-center justify-center text-zinc-400 hover:text-pink-400 active:scale-90 transition-all">
            <Heart size={18} />
          </button>
        </div>
      </header>

      {/* ─── Day Info ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4">
        
        {/* Title block */}
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase bg-zinc-900/60 backdrop-blur px-2.5 py-1 rounded-full border border-zinc-800/60">
              {day.dayLabel}
            </span>
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
              timerMode === "fast"
                ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
            }`}>
              {timerMode === "fast" ? "⚡ Modo Rápido" : "🟢 Modo Normal"}
            </span>
          </div>

          <h1 className="text-5xl font-black tracking-tighter text-white leading-none mb-2">
            {day.title}
          </h1>
          <p className="text-zinc-400 text-sm font-mono">{day.subtitle} · {day.duration}</p>

          <div className="flex gap-3 mt-4">
            <div className="text-center bg-zinc-900/60 backdrop-blur border border-zinc-800/60 rounded-xl px-4 py-2">
              <p className="text-xs text-zinc-500 font-mono">Ejercicios</p>
              <p className="text-lg font-black text-white">{day.exercises.length}</p>
            </div>
            <div className="text-center bg-zinc-900/60 backdrop-blur border border-zinc-800/60 rounded-xl px-4 py-2">
              <p className="text-xs text-zinc-500 font-mono">Descanso</p>
              <p className="text-lg font-black text-white">{timerMode === "normal" ? "3 min" : "2 min"}</p>
            </div>
            <div className="text-center bg-zinc-900/60 backdrop-blur border border-zinc-800/60 rounded-xl px-4 py-2">
              <p className="text-xs text-zinc-500 font-mono">Series</p>
              <p className="text-lg font-black text-white">3–4</p>
            </div>
          </div>
        </div>

        {/* ─── Exercise List ──────────────────────────────────────────────────── */}
        <div className="flex-1 space-y-2 pb-28">
          {day.exercises.map((exercise, idx) => (
            <ExerciseRow
              key={idx}
              exercise={exercise}
              index={idx}
              isElla={isElla}
              onClick={() => onSelectExercise(exercise)}
            />
          ))}
        </div>
      </div>

      {/* ─── Fixed Bottom CTA ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            id="start-routine-btn"
            onClick={() => onSelectExercise(day.exercises[0])}
            className="w-full bg-white text-zinc-950 font-black text-base tracking-wide py-4 rounded-2xl shadow-2xl shadow-black/50 active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2"
          >
            <Zap size={18} className="text-zinc-900" />
            Iniciar Rutina
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ExerciseRow ───────────────────────────────────────────────────────────────
function ExerciseRow({
  exercise,
  index,
  isElla,
  onClick,
}: {
  exercise: ExerciseConfig;
  index: number;
  isElla: boolean;
  onClick: () => void;
}) {
  const imgSrc = getImageSrc(exercise.imageKey);

  return (
    <button
      id={`exercise-row-${index}`}
      onClick={onClick}
      className="w-full text-left bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-3 flex items-center gap-3 hover:bg-zinc-900/80 hover:border-zinc-700/60 active:scale-[0.98] transition-all duration-150 group"
    >
      {/* Thumbnail */}
      <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={exercise.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-lg">💪</div>
        )}
      </div>

      {/* Name + tags */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {exercise.isSuperset && (
            <span className={`text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full ${
              isElla ? "bg-pink-500/15 text-pink-400" : "bg-amber-500/15 text-amber-400"
            }`}>
              ⛓️ SUPERSET
            </span>
          )}
          {exercise.isDropset && (
            <span className="text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400">
              💥 DROPSET
            </span>
          )}
        </div>
        <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">{exercise.name}</p>
        {exercise.notes && (
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{exercise.notes}</p>
        )}
      </div>

      <ChevronRight size={18} className="text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </button>
  );
}
