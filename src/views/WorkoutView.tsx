import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Zap, Clock, Check, RotateCcw, ArrowLeft, ArrowRight,
  ChevronRight, Plus, Minus, Sparkles, Info, Flame,
} from "lucide-react";
import { getRoutineForProfile, getImageSrc } from "@/data/routines";
import type { ProfileId } from "@/data/routines";
import { gymDb } from "@/db/olympusDb";
import { addSession } from "@/db/profileStore";
import type { ExerciseLog } from "@/db/profileStore";
import type { TimerMode, Theme } from "@/App";

interface WorkoutViewProps {
  profile: ProfileId;
  theme: Theme;
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
}

interface ExerciseExecutionState {
  completed: boolean;
  warmupEnabled: boolean;
  warmupWeight: string;
  topSetWeight: string;
  topSetReps: string;
  bo1Weight: string;
  bo1Reps: string;
  bo2Weight: string;
  bo2Reps: string;
  bo3Enabled: boolean;
  bo3Weight: string;
  bo3Reps: string;
}

interface WorkoutSession {
  dayId: string;
  timerMode: TimerMode;
  currentExIdx: number;
  exerciseStates: ExerciseExecutionState[];
}

function evaluateReps(reps: number): { message: string; color: string; icon: string } | null {
  if (reps <= 0) return null;
  if (reps > 12) return { message: "Peso muy ligero. ¡Sube el peso de inmediato!", color: "text-blue-400", icon: "⚡" };
  if (reps === 12) return { message: "¡Dominado al fallo! Próxima sesión: Subir peso.", color: "text-emerald-400", icon: "🔥" };
  if (reps >= 8) return { message: "Zona óptima. Mantén el peso hasta alcanzar 12 reps.", color: "text-amber-400", icon: "🎯" };
  return { message: "Peso excesivo. Baja la carga para rango seguro (8-12).", color: "text-red-400", icon: "💡" };
}

function makeEmptyStates(count: number): ExerciseExecutionState[] {
  return Array.from({ length: count }, () => ({
    completed: false,
    warmupEnabled: false,
    warmupWeight: "",
    topSetWeight: "",
    topSetReps: "",
    bo1Weight: "",
    bo1Reps: "",
    bo2Weight: "",
    bo2Reps: "",
    bo3Enabled: false,
    bo3Weight: "",
    bo3Reps: "",
  }));
}

export default function WorkoutView({ profile, theme, onTimerModeChange }: WorkoutViewProps) {
  const isDark = theme === "dark";
  const isElla = profile === "ella";
  const routine = getRoutineForProfile(profile);

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [pendingTimerMode, setPendingTimerMode] = useState<TimerMode>("normal");
  const [validationMsg, setValidationMsg] = useState("");

  const selectedDay = selectedDayId ? routine.find((d) => d.id === selectedDayId) ?? null : null;

  // ── Session mutators ──────────────────────────────────────────────
  const updateExState = (idx: number, patch: Partial<ExerciseExecutionState>) => {
    setActiveSession((prev) => {
      if (!prev) return null;
      const states = prev.exerciseStates.map((s) => ({ ...s }));
      Object.assign(states[idx], patch);
      return { ...prev, exerciseStates: states };
    });
  };

  const goToExercise = (idx: number) => {
    setActiveSession((prev) => (prev ? { ...prev, currentExIdx: idx } : null));
  };

  const startSession = () => {
    if (!selectedDay) return;
    onTimerModeChange(pendingTimerMode);
    setActiveSession({
      dayId: selectedDay.id,
      timerMode: pendingTimerMode,
      currentExIdx: 0,
      exerciseStates: makeEmptyStates(selectedDay.exercises.length),
    });
  };

  const finishSession = () => {
    const s = activeSession;
    if (!s) return;
    const day = routine.find((d) => d.id === s.dayId);
    if (!day) return;

    const today = new Date().toLocaleDateString("en-CA");
    const completedExercises: ExerciseLog[] = day.exercises.map((ex, idx) => {
      const st = s.exerciseStates[idx];
      return {
        exerciseName: ex.name,
        topSetWeight: st.topSetWeight,
        topSetReps: st.topSetReps,
        bo1Weight: st.bo1Weight,
        bo1Reps: st.bo1Reps,
        bo2Weight: st.bo2Weight,
        bo2Reps: st.bo2Reps,
        bo3Weight: st.bo3Weight,
        bo3Reps: st.bo3Reps,
        bo3Enabled: st.bo3Enabled,
        warmupEnabled: st.warmupEnabled,
        warmupWeight: st.warmupWeight,
        isCompleted: st.completed,
        unit: "kg" as const,
      };
    });

    addSession(profile, {
      date: today,
      dayId: day.id,
      dayLabel: day.dayLabel,
      dayTitle: day.title,
      timestamp: Date.now(),
      exercises: completedExercises,
    });

    window.dispatchEvent(new Event("gym_db_update"));
    setActiveSession(null);
    setSelectedDayId(null);
  };

  const handleComplete = () => {
    const s = activeSession;
    if (!s) return;
    const st = s.exerciseStates[s.currentExIdx];
    if (!st) return;

    if (st.completed) {
      updateExState(s.currentExIdx, { completed: false });
      return;
    }

    const topSetDone = parseFloat(st.topSetWeight) > 0 && parseInt(st.topSetReps) > 0;
    const bo1Done = parseFloat(st.bo1Weight) > 0 && parseInt(st.bo1Reps) > 0;
    const bo2Done = parseFloat(st.bo2Weight) > 0 && parseInt(st.bo2Reps) > 0;

    if (!topSetDone || !bo1Done || !bo2Done) {
      setValidationMsg("Debes registrar libras y repeticiones en los 3 sets principales para completar este ejercicio");
      setTimeout(() => setValidationMsg(""), 3500);
      return;
    }

    updateExState(s.currentExIdx, { completed: true });

    const day = routine.find((d) => d.id === s.dayId);
    const ex = day?.exercises[s.currentExIdx];
    if (ex) {
      gymDb.addWorkoutLog({
        date: new Date().toLocaleDateString("en-CA"),
        timestamp: Date.now(),
        profile,
        dayId: s.dayId,
        exerciseName: ex.name,
        topSetWeight: st.topSetWeight,
        topSetReps: st.topSetReps,
        bo1Weight: st.bo1Weight,
        bo1Reps: st.bo1Reps,
        bo2Weight: st.bo2Weight,
        bo2Reps: st.bo2Reps,
        bo3Weight: st.bo3Weight,
        bo3Reps: st.bo3Reps,
        bo3Enabled: st.bo3Enabled,
        unit: "kg",
      }).catch((e) => console.error("Save error", e));
    }
  };

  // ── Theme tokens ──────────────────────────────────────────────────
  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-200 shadow-sm";
  const accentFrom = isElla ? "from-pink-600" : "from-amber-500";
  const accentTo = isElla ? "to-rose-700" : "to-orange-600";
  const accentText = isElla ? "text-pink-400" : "text-amber-400";
  const accentBorder = isElla ? "border-pink-500/40" : "border-amber-500/40";
  const accentBg = isElla ? "bg-pink-500/10" : "bg-amber-500/10";
  // ── Card entry animation (restored from working HomeView) ──────────
  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 },
    }),
  };

  // ==================================================================
  // PHASE 1 — Day Selection
  // ==================================================================
  if (selectedDayId === null && activeSession === null) {
    return (
      <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-8 space-y-5 overflow-y-auto">
          <div>
            <p className={`text-xs font-mono uppercase tracking-widest ${textMuted}`}>Workout</p>
            <h1 className={`text-3xl font-black tracking-tighter ${textPrimary}`}>Elige tu entrenamiento</h1>
          </div>

          <div className="space-y-3">
            {routine.map((day, idx) => {
              const imgSrc = getImageSrc(day.heroBg);
              const accentGradient = isElla ? "from-pink-600/70 to-rose-700/50" : "from-amber-500/70 to-orange-600/50";
              return (
                <motion.button
                  key={day.id}
                  id={`day-card-${idx}`}
                  onClick={() => setSelectedDayId(day.id)}
                  variants={cardVariants}
                  custom={idx}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full text-left rounded-2xl overflow-hidden relative group shadow-sm ${
                    isDark ? "shadow-black/30" : "shadow-zinc-200/80"
                  }`}
                  style={{ minHeight: "120px" }}
                >
                  {/* Base background layer */}
                  <div className={`absolute inset-0 ${isDark ? "bg-zinc-900" : "bg-white border border-zinc-200"} rounded-2xl`} />

                  {/* Hero image background */}
                  {imgSrc && (
                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                      <img src={imgSrc} alt={day.title}
                        className={`w-full h-full object-cover ${isDark ? "opacity-25 group-hover:opacity-35" : "opacity-10 group-hover:opacity-20"} transition-opacity duration-300`}
                      />
                    </div>
                  )}

                  {/* Accent gradient overlay */}
                  {isDark
                    ? <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-50 rounded-2xl`} />
                    : <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-20 rounded-2xl`} />
                  }

                  {/* Content gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? "from-zinc-950/90 via-zinc-950/50 to-transparent" : "from-white/95 via-white/70 to-transparent"} rounded-2xl`} />

                  {/* Foreground content */}
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
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // PHASE 2 — Day Preview (selected, not started)
  // ==================================================================
  if (selectedDayId !== null && activeSession === null) {
    return (
      <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
        {/* Header */}
        <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-zinc-950/95 border-zinc-900/80" : "bg-white/95 border-zinc-200"}`}>
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelectedDayId(null)}
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center active:scale-90 transition-all ${
                isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"
              }`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1 text-center">
              <p className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>
                {selectedDay?.dayLabel ?? ""}
              </p>
              <h1 className={`text-sm font-black leading-tight truncate ${textPrimary}`}>
                {selectedDay?.title ?? ""}
              </h1>
            </div>
          </div>
        </header>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 pt-4 pb-36 space-y-2">
          {selectedDay?.exercises.map((ex, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${cardBg}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                isDark ? "bg-zinc-800" : "bg-zinc-100"
              }`}>
                <img
                  src={getImageSrc(ex.imageKey)}
                  alt={ex.name}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${textPrimary}`}>{ex.name}</p>
                {ex.notes && (
                  <p className={`text-[10px] mt-0.5 truncate ${textMuted}`}>{ex.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {ex.isSuperset && <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">⛓️ SS</span>}
                {ex.isDropset && <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">💥 DROP</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Timer mode + Start */}
        <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>Descanso:</span>
              <div className={`flex items-center border rounded-2xl p-0.5 gap-0.5 ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
              }`}>
                <button
                  onClick={() => setPendingTimerMode("normal")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pendingTimerMode === "normal"
                      ? isDark ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-900 text-white shadow-md"
                      : isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  <Clock size={11} /> Normal 3′
                </button>
                <button
                  onClick={() => setPendingTimerMode("fast")}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    pendingTimerMode === "fast"
                      ? isDark ? "bg-white text-zinc-950 shadow-md" : "bg-zinc-900 text-white shadow-md"
                      : isDark ? "text-zinc-400" : "text-zinc-500"
                  }`}
                >
                  <Zap size={11} /> Rápido 2′
                </button>
              </div>
              <span className={`text-[10px] font-mono ${textMuted}`}>
                ≈{selectedDay ? (pendingTimerMode === "normal" ? selectedDay.exercises.length * 8 : selectedDay.exercises.length * 5) : 0} min
              </span>
            </div>
            <motion.button
              id="start-workout-btn"
              onClick={startSession}
              whileTap={{ scale: 0.95 }}
              className={`w-full py-4 rounded-2xl font-black text-base tracking-wide shadow-2xl flex items-center justify-center gap-2 ${
                isDark
                  ? "bg-white text-zinc-950 shadow-black/50"
                  : "bg-zinc-900 text-white shadow-zinc-900/30"
              }`}
            >
              <Zap size={18} /> INICIAR RUTINA
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================================
  // PHASE 3 — Active Workout Execution
  // ==================================================================
  const session = activeSession!;
  const day = routine.find((d) => d.id === session.dayId)!;
  const currentEx = day.exercises[session.currentExIdx];
  const currentState = session.exerciseStates[session.currentExIdx];

  if (!currentEx || !currentState) return null;

  const totalExercises = day.exercises.length;
  const isLastExercise = session.currentExIdx === totalExercises - 1;
  const isFirstExercise = session.currentExIdx === 0;

  const topSetDone = parseFloat(currentState.topSetWeight) > 0 && parseInt(currentState.topSetReps) > 0;
  const bo1Done = parseFloat(currentState.bo1Weight) > 0 && parseInt(currentState.bo1Reps) > 0;
  const bo2Done = parseFloat(currentState.bo2Weight) > 0 && parseInt(currentState.bo2Reps) > 0;
  const canComplete = topSetDone && bo1Done && bo2Done;
  const isCompleted = currentState.completed;

  const imgSrc = getImageSrc(currentEx.imageKey);
  const repFeedback = evaluateReps(parseInt(currentState.topSetReps) || 0);
  const step = 2.5;

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-zinc-950/95 border-zinc-900/80" : "bg-white/95 border-zinc-200"}`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => { setActiveSession(null); setSelectedDayId(session.dayId); }}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center active:scale-90 transition-all ${
              isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>
              {day.dayLabel} · {session.currentExIdx + 1}/{totalExercises}
            </p>
            <h1 className={`text-sm font-black leading-tight truncate px-2 ${textPrimary}`}>{currentEx.name}</h1>
          </div>
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xs font-black font-mono ${
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
          }`}>
            {session.currentExIdx + 1}/{totalExercises}
          </div>
        </div>

        {/* Navigation dots — backward always allowed, forward disabled until completed */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {day.exercises.map((_, idx) => {
            const st = session.exerciseStates[idx];
            const isActive = idx === session.currentExIdx;
            const isAhead = idx > session.currentExIdx;
            return (
              <button
                key={idx}
                disabled={isAhead && !st?.completed}
                onClick={() => goToExercise(idx)}
                className={`w-6 h-1.5 rounded-full transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-pink-500 w-8"
                    : st?.completed
                      ? "bg-emerald-500"
                      : isAhead
                        ? isDark ? "bg-zinc-800 cursor-not-allowed" : "bg-zinc-200 cursor-not-allowed"
                        : isDark ? "bg-zinc-700" : "bg-zinc-300"
                }`}
              />
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        {/* ── Exercise Image ──────────────────────────────────── */}
        <div className={`relative mx-4 mt-4 rounded-3xl overflow-hidden ${isDark ? "bg-zinc-900" : "bg-zinc-100 border border-zinc-200"}`} style={{ height: "200px" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={currentEx.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">💪</div>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 px-4 mt-3">
          {currentEx.isSuperset && (
            <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${accentBg} ${accentText} border ${accentBorder}`}>⛓️ SUPERSET</span>
          )}
          {currentEx.isDropset && (
            <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">💥 DROPSET</span>
          )}
          {currentEx.notes && !currentEx.isSuperset && !currentEx.isDropset && (
            <span className={`text-[10px] font-mono flex items-center gap-1 ${textMuted}`}><Info size={10} /> {currentEx.notes}</span>
          )}
        </div>

        {/* ── Sets & Reps Module ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
          className={`mx-4 mt-4 rounded-3xl border overflow-hidden ${cardBg}`}
        >
          {/* Warm-up toggle bar */}
          <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800/60" : "border-zinc-100"}`}>
            <div>
              <p className={`text-xs font-black tracking-widest uppercase ${textPrimary}`}>SETS & REPS</p>
              <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>
                {currentState.warmupEnabled ? "Calentamiento + 4 sets de trabajo" : "4 sets de trabajo"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${textMuted}`}>Warm-Up</span>
              <button
                onClick={() => updateExState(session.currentExIdx, { warmupEnabled: !currentState.warmupEnabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  currentState.warmupEnabled ? `bg-gradient-to-r ${accentFrom} ${accentTo}` : "bg-zinc-700"
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                  currentState.warmupEnabled ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>

          {/* Warm-up (optional, weight only) */}
          {currentState.warmupEnabled && (
            <div className={`px-5 py-4 border-b ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Calentamiento</p>
                  <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>~50% del peso · Sin registro de reps</p>
                </div>
                <NumericStepper value={currentState.warmupWeight} onChange={(v) => updateExState(session.currentExIdx, { warmupWeight: v })} unit="kg" step={step} isDark={isDark} />
              </div>
            </div>
          )}

          {/* Set 1 · Top Set (mandatory, weight + reps) */}
          <div className={`px-5 py-4 border-b border-l-2 ${accentBg} ${accentBorder} ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-black ${accentText} flex items-center gap-1.5`}>
                Set 1 · Top Set <Sparkles size={13} className="animate-pulse" />
              </p>
              <span className={`text-[10px] font-mono ${textMuted}`}>Máximo esfuerzo</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col items-center gap-1 flex-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Peso (kg)</p>
                <NumericStepper value={currentState.topSetWeight} onChange={(v) => updateExState(session.currentExIdx, { topSetWeight: v })} unit="kg" step={step} highlight isDark={isDark} />
              </div>
              <span className="text-zinc-600 font-black text-xl">×</span>
              <div className="flex flex-col items-center gap-1 flex-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Reps</p>
                <RepStepper value={currentState.topSetReps} onChange={(v) => updateExState(session.currentExIdx, { topSetReps: v })} highlight isDark={isDark} />
              </div>
            </div>
            {repFeedback && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2">
                <span className="text-base">{repFeedback.icon}</span>
                <p className={`text-xs font-semibold ${repFeedback.color}`}>{repFeedback.message}</p>
              </div>
            )}
          </div>

          {/* Set 2 · Back-off 1 (mandatory, weight + reps) */}
          <SetBlock label="Set 2 · Back-off 1" desc="Baja ligeramente el peso"
            weight={currentState.bo1Weight} reps={currentState.bo1Reps}
            onWeightChange={(v) => updateExState(session.currentExIdx, { bo1Weight: v })}
            onRepsChange={(v) => updateExState(session.currentExIdx, { bo1Reps: v })}
            isDark={isDark} step={step}
          />
          {/* Set 3 · Back-off 2 (mandatory, weight + reps) */}
          <SetBlock label="Set 3 · Back-off 2" desc="Baja un poco más el peso"
            weight={currentState.bo2Weight} reps={currentState.bo2Reps}
            onWeightChange={(v) => updateExState(session.currentExIdx, { bo2Weight: v })}
            onRepsChange={(v) => updateExState(session.currentExIdx, { bo2Reps: v })}
            isDark={isDark} step={step}
          />

          {/* Set 4 · Back-off 3 (optional) */}
          <div className={`border-b ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <div className={`px-5 py-3 flex items-center justify-between`}>
              <p className={`text-xs font-bold ${textMuted}`}>Set 4 · Back-off 3 (opcional)</p>
              <button
                onClick={() => updateExState(session.currentExIdx, { bo3Enabled: !currentState.bo3Enabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${currentState.bo3Enabled ? "bg-pink-500" : "bg-zinc-700"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${currentState.bo3Enabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            {currentState.bo3Enabled && (
              <div className="px-5 pb-4">
                <SetBlock label="Back-off 3" desc="Cuarto set opcional"
                  weight={currentState.bo3Weight} reps={currentState.bo3Reps}
                  onWeightChange={(v) => updateExState(session.currentExIdx, { bo3Weight: v })}
                  onRepsChange={(v) => updateExState(session.currentExIdx, { bo3Reps: v })}
                  isDark={isDark} step={step}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Validation toast */}
        <AnimatePresence>
          {validationMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-4 mt-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-start gap-2"
            >
              <span className="text-sm flex-shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs font-semibold text-red-500 leading-relaxed">{validationMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rest Timer ─────────────────────────────────────── */}
        <WorkoutTimer
          timerMode={session.timerMode} isElla={isElla}
          accentFrom={accentFrom} accentTo={accentTo}
          cardBg={cardBg} textPrimary={textPrimary} textMuted={textMuted}
        />

        {/* Notes */}
        {currentEx.notes && (
          <div className={`mx-4 mb-6 p-4 rounded-2xl border ${isDark ? "bg-zinc-900/40 border-zinc-800/40" : "bg-zinc-50 border-zinc-200"}`}>
            <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${textMuted}`}>📝 Técnica</p>
            <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{currentEx.notes}</p>
          </div>
        )}

        {/* Dropset note */}
        {currentEx.isDropset && (
          <div className={`mx-4 mb-6 p-4 rounded-2xl border ${isDark ? "bg-red-950/20 border-red-900/40" : "bg-red-50 border-red-200"}`}>
            <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-red-400" : "text-red-500"}`}>💥 DROPSET</p>
            <p className={`text-sm leading-relaxed ${isDark ? "text-red-300/80" : "text-red-600"}`}>
              Top Set pesado → Drop inmediato sin descanso. Baja ~20% en cada drop.
            </p>
          </div>
        )}

        <div className="h-36" />
      </div>

      {/* ── Bottom Nav: Prev / Complete / Next ────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <button
              disabled={isFirstExercise}
              onClick={() => goToExercise(session.currentExIdx - 1)}
              className={`flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                isFirstExercise ? "opacity-30 cursor-not-allowed" : isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <ArrowLeft size={14} /> Anterior
            </button>

            <button
              id="complete-exercise-btn"
              onClick={handleComplete}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 ${
                isCompleted
                  ? "bg-emerald-500 text-white"
                  : canComplete
                    ? `bg-gradient-to-r ${accentFrom} ${accentTo} text-white`
                    : isDark
                      ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                      : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <Check size={16} strokeWidth={3} />
              {isCompleted ? "Completado ✓" : "Completar Ejercicio"}
            </button>

            {isLastExercise ? (
              <button
                id="finish-workout-btn"
                onClick={finishSession}
                className="flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 bg-pink-500 text-white border-pink-400"
              >
                <Flame size={14} /> Terminar
              </button>
            ) : (
              <button
                id="next-exercise-btn"
                disabled={!isCompleted}
                onClick={() => goToExercise(session.currentExIdx + 1)}
                className={`flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                  isCompleted
                    ? isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    : "opacity-30 cursor-not-allowed"
                }`}
              >
                Siguiente <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Workout Timer ─────────────────────────────────────────────────────
function WorkoutTimer({ timerMode, isElla, accentFrom, accentTo, cardBg, textPrimary, textMuted }: {
  timerMode: TimerMode;
  isElla: boolean;
  accentFrom: string;
  accentTo: string;
  cardBg: string;
  textPrimary: string;
  textMuted: string;
}) {
  const totalSeconds = timerMode === "normal" ? 180 : 120;
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setTimerActive(false);
            setTimerDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timerActive, timerSeconds]);

  const startTimer = () => { setTimerDone(false); setTimerSeconds(totalSeconds); setTimerActive(true); };
  const resetTimer = () => { setTimerActive(false); setTimerSeconds(0); setTimerDone(false); if (intervalRef.current) clearInterval(intervalRef.current); };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const circumference = 2 * Math.PI * 38;
  const progress = timerActive ? (timerSeconds / totalSeconds) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={`mx-4 mt-4 mb-6 rounded-3xl border p-5 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-xs font-black tracking-widest uppercase ${textPrimary}`}>⏱ Descanso</p>
          <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>{timerMode === "normal" ? "Modo Normal · 3:00" : "Modo Rápido · 2:00"}</p>
        </div>
        {timerActive && <button onClick={resetTimer} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-90 transition-all"><RotateCcw size={14} /></button>}
      </div>
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={timerDone ? "#10b981" : isElla ? "#ec4899" : "#f59e0b"} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={timerActive ? strokeDashoffset : timerDone ? 0 : circumference} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {timerDone ? <span className="text-2xl">✅</span> : <span className={`text-lg font-black font-mono ${textPrimary}`}>{timerActive ? formatTime(timerSeconds) : formatTime(totalSeconds)}</span>}
          </div>
        </div>
        <div className="flex-1">
          {timerDone ? <p className="text-sm font-bold text-emerald-500 mb-3">¡Descanso completo! 💪</p> : <p className={`text-sm mb-3 ${textMuted}`}>{timerActive ? "Descansando..." : "Start para timer de descanso."}</p>}
          <motion.button onClick={timerActive ? resetTimer : startTimer} whileTap={{ scale: 0.95 }}
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${timerActive ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white shadow-lg`}`}>
            {timerActive ? <><RotateCcw size={15} /> Cancelar</> : <><Zap size={15} /> {timerDone ? "Otro descanso" : "Start"}</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Numeric Stepper ───────────────────────────────────────────────────
function NumericStepper({ value, onChange, unit, step = 2.5, min = 0, highlight = false, isDark = false }: {
  value: string; onChange: (v: string) => void; unit: string; step?: number; min?: number; highlight?: boolean; isDark?: boolean;
}) {
  const numVal = parseFloat(value) || 0;
  const btnBase = highlight
    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
    : isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950" : "border-zinc-200 text-zinc-900 focus:border-zinc-400 bg-white";
  return (
    <div className="flex items-center gap-1.5">
      <motion.button type="button" onClick={() => onChange(String(Math.max(min, +(numVal - step).toFixed(1))))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}><Minus size={14} strokeWidth={2.5} /></motion.button>
      <input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={unit}
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border outline-none transition-colors ${inputBase}`} />
      <motion.button type="button" onClick={() => onChange(String(+(numVal + step).toFixed(1)))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}><Plus size={14} strokeWidth={2.5} /></motion.button>
    </div>
  );
}

function RepStepper({ value, onChange, highlight = false, isDark = false }: {
  value: string; onChange: (v: string) => void; highlight?: boolean; isDark?: boolean;
}) {
  const numVal = parseInt(value) || 0;
  const btnBase = highlight
    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
    : isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950" : "border-zinc-200 text-zinc-900 focus:border-zinc-400 bg-white";
  return (
    <div className="flex items-center gap-1.5">
      <motion.button type="button" onClick={() => onChange(String(Math.max(0, numVal - 1)))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}><Minus size={14} strokeWidth={2.5} /></motion.button>
      <input type="text" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Reps"
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border outline-none transition-colors ${inputBase}`} />
      <motion.button type="button" onClick={() => onChange(String(numVal + 1))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}><Plus size={14} strokeWidth={2.5} /></motion.button>
    </div>
  );
}

function SetBlock({ label, desc, weight, reps, onWeightChange, onRepsChange, isDark, step }: {
  label: string; desc: string; weight: string; reps: string;
  onWeightChange: (v: string) => void; onRepsChange: (v: string) => void;
  isDark: boolean; step: number;
}) {
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const borderCls = isDark ? "border-zinc-800/40" : "border-zinc-100";
  return (
    <div className={`px-5 py-4 border-b ${borderCls}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{label}</p>
        <span className={`text-[10px] font-mono ${textMuted}`}>{desc}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col items-center gap-1 flex-1">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Peso (kg)</p>
          <NumericStepper value={weight} onChange={onWeightChange} unit="kg" step={step} isDark={isDark} />
        </div>
        <span className="text-zinc-600 font-black text-xl">×</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Reps</p>
          <RepStepper value={reps} onChange={onRepsChange} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}
