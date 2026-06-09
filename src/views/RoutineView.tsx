import { ArrowLeft, Heart, ChevronRight, Zap, Clock } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay, ExerciseConfig } from "@/data/routines";
import type { TimerMode, Theme } from "@/App";

const listVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1, x: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

interface RoutineViewProps {
  profile: ProfileId;
  day: RoutineDay;
  unit: "kg" | "lbs";
  theme: Theme;
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  onBack: () => void;
  onSelectExercise: (exercise: ExerciseConfig) => void;
}

export default function RoutineView({
  profile, day, theme, timerMode, onTimerModeChange, onBack, onSelectExercise,
}: RoutineViewProps) {
  const isElla = profile === "ella";
  const isDark = theme === "dark";
  const heroBg = getImageSrc(day.heroBg);
  const normalDuration = day.exercises.length * 8;
  const fastDuration = day.exercises.length * 5;

  return (
    <div className={`min-h-screen flex flex-col relative overflow-hidden ${isDark ? "bg-zinc-950" : "bg-zinc-50"}`}>

      {/* ── Hero Background ──────────────────────────────────────────── */}
      <div className="absolute inset-0">
        {heroBg && (
          <img
            src={heroBg} alt={day.title}
            className="w-full h-full object-cover object-center"
            style={{ filter: "blur(2px)", transform: "scale(1.06)" }}
          />
        )}
        {/* Dark mode: fade to black; Light mode: fade to white */}
        {isDark
          ? <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
          : <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/50" />
        }
      </div>

      {/* ── Floating Header ──────────────────────────────────────────── */}
      <header className="relative z-20 safe-top">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2 flex items-center justify-between">
          <button id="routine-back-btn" onClick={onBack}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
              isDark
                ? "bg-zinc-900/70 border-zinc-800/60 text-zinc-300 hover:text-white"
                : "bg-white/80 border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm"
            }`}>
            <ArrowLeft size={18} />
          </button>

          {/* Timer mode pill */}
          <div className={`flex items-center backdrop-blur-md border rounded-2xl p-1 gap-1 ${
            isDark ? "bg-zinc-900/70 border-zinc-800/60" : "bg-white/80 border-zinc-200 shadow-sm"
          }`}>
            <button id="timer-normal-btn" onClick={() => onTimerModeChange("normal")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                timerMode === "normal"
                  ? isDark ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-900 text-white shadow-md"
                  : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"
              }`}>
              <Clock size={11} /> {normalDuration} min
            </button>
            <button id="timer-fast-btn" onClick={() => onTimerModeChange("fast")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                timerMode === "fast"
                  ? isDark ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-900 text-white shadow-md"
                  : isDark ? "text-zinc-400 hover:text-zinc-200" : "text-zinc-500 hover:text-zinc-800"
              }`}>
              <Zap size={11} /> {fastDuration} min
            </button>
          </div>

          <button className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
            isDark
              ? "bg-zinc-900/70 border-zinc-800/60 text-zinc-400 hover:text-pink-400"
              : "bg-white/80 border-zinc-200 text-zinc-400 hover:text-pink-500 shadow-sm"
          }`}>
            <Heart size={18} />
          </button>
        </div>
      </header>

      {/* ── Day Info ─────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col max-w-2xl mx-auto w-full px-4">
        <div className="mt-8 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border backdrop-blur ${
              isDark ? "bg-zinc-900/60 border-zinc-800/60 text-zinc-400" : "bg-white/80 border-zinc-200 text-zinc-500"
            }`}>{day.dayLabel}</span>
            <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
              timerMode === "fast"
                ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                : "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
            }`}>{timerMode === "fast" ? "⚡ Modo Rápido" : "🟢 Modo Normal"}</span>
          </div>

          <h1 className={`text-5xl font-black tracking-tighter leading-none mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
            {day.title}
          </h1>
          <p className={`text-sm font-mono ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
            {day.subtitle} · {day.duration}
          </p>

          <div className="flex gap-3 mt-4">
            {[
              { label: "Ejercicios", value: day.exercises.length },
              { label: "Descanso", value: timerMode === "normal" ? "3 min" : "2 min" },
              { label: "Series", value: "3–4" },
            ].map(({ label, value }) => (
              <div key={label} className={`text-center backdrop-blur border rounded-xl px-4 py-2 ${
                isDark ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white/80 border-zinc-200 shadow-sm"
              }`}>
                <p className={`text-xs font-mono ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{label}</p>
                <p className={`text-lg font-black ${isDark ? "text-white" : "text-zinc-900"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Exercise List ─────────────────────────────────────────── */}
        <motion.div
          className="flex-1 space-y-2 pb-28"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          {day.exercises.map((exercise, idx) => (
            <ExerciseRow
              key={idx}
              exercise={exercise}
              index={idx}
              isElla={isElla}
              isDark={isDark}
              onClick={() => onSelectExercise(exercise)}
            />
          ))}
        </motion.div>
      </div>

      {/* ── Fixed Bottom CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <button id="start-routine-btn"
            onClick={() => onSelectExercise(day.exercises[0])}
            className={`w-full font-black text-base tracking-wide py-4 rounded-2xl shadow-2xl active:scale-[0.98] transition-transform duration-150 flex items-center justify-center gap-2 ${
              isDark
                ? "bg-white text-zinc-950 shadow-black/50"
                : "bg-zinc-900 text-white shadow-zinc-900/30"
            }`}>
            <Zap size={18} />
            Iniciar Rutina
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ExerciseRow ───────────────────────────────────────────────────────────────
function ExerciseRow({ exercise, index, isElla, isDark, onClick }: {
  exercise: ExerciseConfig; index: number; isElla: boolean; isDark: boolean; onClick: () => void;
}) {
  const imgSrc = getImageSrc(exercise.imageKey);
  const tagAccent = isElla
    ? "bg-pink-500/10 text-pink-500 border-pink-500/20"
    : "bg-amber-500/10 text-amber-500 border-amber-500/20";

  return (
    <motion.button
      id={`exercise-row-${index}`}
      onClick={onClick}
      variants={itemVariants}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`w-full text-left rounded-2xl p-3 flex items-center gap-3 backdrop-blur-md border transition-colors duration-150 group ${
        isDark
          ? "bg-zinc-900/60 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700/60"
          : "bg-white/80 border-zinc-200 hover:bg-white hover:border-zinc-300 shadow-sm"
      }`}>
      <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
        {imgSrc
          ? <img src={imgSrc} alt={exercise.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-lg">💪</div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {exercise.isSuperset && (
            <span className={`text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${tagAccent}`}>⛓️ SS</span>
          )}
          {exercise.isDropset && (
            <span className="text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">💥 DROP</span>
          )}
        </div>
        <p className={`text-sm font-semibold leading-tight truncate ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{exercise.name}</p>
        {exercise.notes && (
          <p className={`text-[10px] mt-0.5 truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{exercise.notes}</p>
        )}
      </div>

      <motion.div
        variants={{
          hidden: { x: -5, opacity: 0 },
          visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 18 } },
        } satisfies Variants}
      >
        <ChevronRight size={18} className={`flex-shrink-0 group-hover:translate-x-0.5 transition-all ${
          isDark ? "text-zinc-600 group-hover:text-zinc-300" : "text-zinc-300 group-hover:text-zinc-600"
        }`} />
      </motion.div>
    </motion.button>
  );
}
