import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Clock, Check, RotateCcw, ArrowLeft, ArrowRight,
  ChevronRight, Plus, Minus, Sparkles, Info, Flame, X,
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
  set1Weight: string;
  topSetWeight: string;
  topSetReps: string;
  set3Weight: string;
  set4Weight: string;
}

type Phase = "select" | "execution";

function evaluateReps(reps: number): { message: string; color: string; icon: string } | null {
  if (reps <= 0) return null;
  if (reps > 12) return { message: "Peso muy ligero. ¡Sube el peso de inmediato!", color: "text-blue-400", icon: "⚡" };
  if (reps === 12) return { message: "¡Dominado al fallo! Próxima sesión: Subir peso.", color: "text-emerald-400", icon: "🔥" };
  if (reps >= 8) return { message: "Zona óptima. Mantén el peso hasta alcanzar 12 reps.", color: "text-amber-400", icon: "🎯" };
  return { message: "Peso excesivo. Baja la carga para rango seguro (8-12).", color: "text-red-400", icon: "💡" };
}

export default function WorkoutView({ profile, theme, timerMode, onTimerModeChange }: WorkoutViewProps) {
  const isDark = theme === "dark";
  const isElla = profile === "ella";
  const routine = getRoutineForProfile(profile);

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showModePicker, setShowModePicker] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<ExerciseExecutionState[]>([]);

  const selectedDay = routine.find((d) => d.id === selectedDayId) || null;

  const startWorkout = (id: string, mode: TimerMode) => {
    const day = routine.find((d) => d.id === id);
    if (!day) return;
    onTimerModeChange(mode);
    setSelectedDayId(id);
    setCurrentExIdx(0);
    setExerciseStates(
      day.exercises.map(() => ({
        completed: false,
        warmupEnabled: false,
        warmupWeight: "",
        set1Weight: "",
        topSetWeight: "",
        topSetReps: "",
        set3Weight: "",
        set4Weight: "",
      }))
    );
    setShowModePicker(false);
    setPhase("execution");
  };

  const finishWorkout = async () => {
    if (!selectedDay) return;
    const today = new Date().toLocaleDateString("en-CA");
    const completedExercises: ExerciseLog[] = selectedDay.exercises
      .map((ex, idx) => {
        const st = exerciseStates[idx];
        return {
          exerciseName: ex.name,
          set1Weight: st.set1Weight,
          topSetWeight: st.topSetWeight,
          topSetReps: st.topSetReps,
          set3Weight: st.set3Weight,
          set4Weight: st.set4Weight,
          warmupEnabled: st.warmupEnabled,
          warmupWeight: st.warmupWeight,
          isCompleted: st.completed,
          unit: "kg" as const,
        };
      });

    addSession(profile, {
      date: today,
      dayId: selectedDay.id,
      dayLabel: selectedDay.dayLabel,
      dayTitle: selectedDay.title,
      timestamp: Date.now(),
      exercises: completedExercises,
    });

    window.dispatchEvent(new Event("gym_db_update"));
    setPhase("select");
    setSelectedDayId(null);
  };

  const updateExState = (idx: number, patch: Partial<ExerciseExecutionState>) => {
    setExerciseStates((prev) => {
      const next = prev.map((s) => ({ ...s }));
      Object.assign(next[idx], patch);
      return next;
    });
  };

  const currentEx = selectedDay?.exercises[currentExIdx] ?? null;
  const currentState = exerciseStates[currentExIdx] ?? null;

  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-200 shadow-sm";

  if (phase === "select") {
    const accentGradient = isElla ? "from-pink-600/70 to-rose-700/50" : "from-amber-500/70 to-orange-600/50";
    return (
      <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-5 overflow-y-auto">
          <div>
            <p className={`text-xs font-mono uppercase tracking-widest ${textMuted}`}>Workout</p>
            <h1 className={`text-3xl font-black tracking-tighter ${textPrimary}`}>Elige tu entrenamiento</h1>
          </div>

          <div className="space-y-3">
            {routine.map((day) => (
              <button
                key={day.id}
                id={`select-day-${day.id}`}
                onClick={() => setSelectedDayId(day.id)}
                className={`w-full text-left rounded-2xl overflow-hidden relative transition-all ${
                  selectedDayId === day.id
                    ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-950"
                    : ""
                } ${isDark ? "shadow-black/30" : "shadow-zinc-200/80"}`}
                style={{ minHeight: "120px" }}
              >
                <div className={`absolute inset-0 ${isDark ? "bg-zinc-900" : "bg-white border border-zinc-200"} rounded-2xl pointer-events-none`} />
                <div className={`absolute inset-0 bg-gradient-to-r ${accentGradient} opacity-50 rounded-2xl pointer-events-none`} />
                <div className={`absolute inset-0 bg-gradient-to-r ${isDark ? "from-zinc-950/90 via-zinc-950/50 to-transparent" : "from-white/95 via-white/70 to-transparent"} rounded-2xl pointer-events-none`} />
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
                  <ChevronRight size={22} className={`flex-shrink-0 ml-2 transition-all ${
                    selectedDayId === day.id ? "text-pink-400 translate-x-1" : isDark ? "text-zinc-600" : "text-zinc-300"
                  }`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start CTA — opens mode picker instead of starting directly */}
        {selectedDayId && (
          <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
            <div className="max-w-2xl mx-auto">
              <motion.button
                id="start-workout-btn"
                onClick={() => setShowModePicker(true)}
                whileTap={{ scale: 0.95 }}
                className={`w-full py-4 rounded-2xl font-black text-base tracking-wide shadow-2xl flex items-center justify-center gap-2 ${
                  isDark
                    ? "bg-white text-zinc-950 shadow-black/50"
                    : "bg-zinc-900 text-white shadow-zinc-900/30"
                }`}
              >
                <Zap size={18} /> Iniciar Rutina
              </motion.button>
            </div>
          </div>
        )}

        {/* ── Mode Picker Modal ───────────────────────────────── */}
        <AnimatePresence>
          {showModePicker && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm"
              onClick={() => setShowModePicker(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`w-full max-w-2xl rounded-t-3xl p-6 pb-10 ${isDark ? "bg-zinc-900" : "bg-white"}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-lg font-black ${textPrimary}`}>Tiempo de descanso</h2>
                  <button
                    onClick={() => setShowModePicker(false)}
                    className={`p-2 rounded-xl border transition-colors ${
                      isDark ? "border-zinc-700 text-zinc-400 hover:bg-zinc-800" : "border-zinc-200 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => startWorkout(selectedDayId!, "normal")}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      isDark
                        ? "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? "bg-zinc-700" : "bg-white border border-zinc-200"
                    }`}>
                      <Clock size={22} className="text-pink-500" />
                    </div>
                    <div className="text-left">
                      <p className={`text-base font-black ${textPrimary}`}>Modo Normal</p>
                      <p className={`text-xs font-mono mt-0.5 ${textMuted}`}>3 minutos de descanso entre series</p>
                    </div>
                    <div className={`ml-auto text-xs font-mono font-bold px-3 py-1.5 rounded-full ${
                      isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-200 text-zinc-600"
                    }`}>
                      {(() => {
                        const day = routine.find((d) => d.id === selectedDayId!);
                        return day ? `${day.exercises.length * 8} min` : "";
                      })()}
                    </div>
                  </button>

                  <button
                    onClick={() => startWorkout(selectedDayId!, "fast")}
                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                      isDark
                        ? "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
                        : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      isDark ? "bg-zinc-700" : "bg-white border border-zinc-200"
                    }`}>
                      <Zap size={22} className="text-amber-500" />
                    </div>
                    <div className="text-left">
                      <p className={`text-base font-black ${textPrimary}`}>Modo Rápido</p>
                      <p className={`text-xs font-mono mt-0.5 ${textMuted}`}>2 minutos de descanso entre series</p>
                    </div>
                    <div className={`ml-auto text-xs font-mono font-bold px-3 py-1.5 rounded-full ${
                      isDark ? "bg-zinc-700 text-zinc-300" : "bg-zinc-200 text-zinc-600"
                    }`}>
                      {(() => {
                        const day = routine.find((d) => d.id === selectedDayId!);
                        return day ? `${day.exercises.length * 5} min` : "";
                      })()}
                    </div>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ───── Execution Phase ─────
  if (!selectedDay || !currentEx || !currentState) return null;

  const totalExercises = selectedDay.exercises.length;
  const isLastExercise = currentExIdx === totalExercises - 1;
  const isFirstExercise = currentExIdx === 0;

  // Validation: check 3 mandatory sets have values
  const topSetDone = parseFloat(currentState.topSetWeight) > 0 && parseInt(currentState.topSetReps) > 0;
  const backoff1Done = parseFloat(currentState.set3Weight) > 0;
  const backoff2Done = parseFloat(currentState.set4Weight) > 0;
  const canComplete = topSetDone && backoff1Done && backoff2Done;
  const isCompleted = currentState.completed;

  // Can we navigate to next exercise?
  const nextAvailable = isCompleted || canComplete;

  const handleComplete = async () => {
    if (!canComplete && !isCompleted) return;

    const newCompleted = !isCompleted;
    updateExState(currentExIdx, { completed: newCompleted });

    if (newCompleted) {
      const today = new Date().toLocaleDateString("en-CA");
      try {
        await gymDb.addWorkoutLog({
          date: today,
          timestamp: Date.now(),
          profile,
          dayId: selectedDay.id,
          exerciseName: currentEx.name,
          set1Weight: currentState.set1Weight,
          topSetWeight: currentState.topSetWeight,
          topSetReps: currentState.topSetReps,
          set3Weight: currentState.set3Weight,
          set4Weight: currentState.set4Weight,
          unit: "kg",
        });
      } catch (e) {
        console.error("Save error", e);
      }
    }
  };

  const goToExercise = (idx: number) => {
    setCurrentExIdx(idx);
  };

  const imgSrc = getImageSrc(currentEx.imageKey);
  const accentFrom = isElla ? "from-pink-600" : "from-amber-500";
  const accentTo = isElla ? "to-rose-700" : "to-orange-600";
  const accentText = isElla ? "text-pink-400" : "text-amber-400";
  const accentBorder = isElla ? "border-pink-500/40" : "border-amber-500/40";
  const accentBg = isElla ? "bg-pink-500/10" : "bg-amber-500/10";

  const repFeedback = evaluateReps(parseInt(currentState.topSetReps) || 0);

  const step = 2.5;

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      {/* ── Header ──────────────────────────────────────────── */}
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-zinc-950/95 border-zinc-900/80" : "bg-white/95 border-zinc-200"}`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => setPhase("select")}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center active:scale-90 transition-all ${
              isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>
              {selectedDay.dayLabel} · {currentExIdx + 1}/{totalExercises}
            </p>
            <h1 className={`text-sm font-black leading-tight truncate px-2 ${textPrimary}`}>{currentEx.name}</h1>
          </div>
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xs font-black font-mono ${
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
          }`}>
            {currentExIdx + 1}/{totalExercises}
          </div>
        </div>

        {/* Exercise navigation dots */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {selectedDay.exercises.map((_, idx) => {
            const exState = exerciseStates[idx];
            const isActive = idx === currentExIdx;
            return (
              <button
                key={idx}
                onClick={() => goToExercise(idx)}
                className={`w-6 h-1.5 rounded-full transition-all flex-shrink-0 ${
                  isActive
                    ? "bg-pink-500 w-8"
                    : exState?.completed
                      ? "bg-emerald-500"
                      : isDark
                        ? "bg-zinc-700"
                        : "bg-zinc-300"
                }`}
              />
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        {/* ── Exercise Image ────────────────────────────────── */}
        <div className={`relative mx-4 mt-4 rounded-3xl overflow-hidden ${isDark ? "bg-zinc-900" : "bg-zinc-100 border border-zinc-200"}`} style={{ height: "200px" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={currentEx.name} className="w-full h-full object-contain p-4" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <span className="text-5xl">💪</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2 px-4 mt-3">
          {currentEx.isSuperset && (
            <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${accentBg} ${accentText} border ${accentBorder}`}>
              ⛓️ SUPERSET
            </span>
          )}
          {currentEx.isDropset && (
            <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              💥 DROPSET
            </span>
          )}
          {currentEx.notes && !currentEx.isSuperset && !currentEx.isDropset && (
            <span className={`text-[10px] font-mono flex items-center gap-1 ${textMuted}`}>
              <Info size={10} /> {currentEx.notes}
            </span>
          )}
        </div>

        {/* ── Sets & Reps Module ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
          className={`mx-4 mt-4 rounded-3xl border overflow-hidden ${cardBg}`}
        >
          <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800/60" : "border-zinc-100"}`}>
            <div>
              <p className={`text-xs font-black tracking-widest uppercase ${textPrimary}`}>SETS & REPS</p>
              <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>
                {currentState.warmupEnabled ? "Calentamiento + 3-4 series" : "3-4 series al fallo"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${textMuted}`}>Warm-Up</span>
              <button
                onClick={() => updateExState(currentExIdx, { warmupEnabled: !currentState.warmupEnabled })}
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

          {/* Warm-up */}
          {currentState.warmupEnabled && (
            <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Warm-Up</p>
                <p className={`text-[11px] font-mono mt-0.5 ${textMuted}`}>~50% del peso</p>
              </div>
              <NumericStepper
                value={currentState.warmupWeight}
                onChange={(v) => updateExState(currentExIdx, { warmupWeight: v })}
                unit="kg"
                step={step}
                isDark={isDark}
              />
            </div>
          )}

          {/* Set 1 · Aproximación */}
          <div className={`px-5 py-4 border-b ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Set 1 · Aproximación</p>
                <p className={`text-[11px] font-mono mt-0.5 ${textMuted}`}>RPE 7</p>
              </div>
              <NumericStepper
                value={currentState.set1Weight}
                onChange={(v) => updateExState(currentExIdx, { set1Weight: v })}
                unit="kg"
                step={step}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Top Set */}
          <div className={`px-5 py-4 border-b border-l-2 ${accentBg} ${accentBorder} ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-black ${accentText} flex items-center gap-1.5`}>
                Top Set <Sparkles size={13} className="animate-pulse" />
              </p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Peso (kg)</p>
                <NumericStepper
                  value={currentState.topSetWeight}
                  onChange={(v) => updateExState(currentExIdx, { topSetWeight: v })}
                  unit="kg"
                  step={step}
                  highlight
                  isDark={isDark}
                />
              </div>
              <div className="text-zinc-700 font-black text-xl">×</div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Reps</p>
                <RepStepper
                  value={currentState.topSetReps}
                  onChange={(v) => updateExState(currentExIdx, { topSetReps: v })}
                  highlight
                  isDark={isDark}
                />
              </div>
            </div>
            {repFeedback && (
              <div className={`mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2`}>
                <span className="text-base">{repFeedback.icon}</span>
                <p className={`text-xs font-semibold ${repFeedback.color}`}>{repFeedback.message}</p>
              </div>
            )}
          </div>

          {/* Back-off sets */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Back-off</p>
                <p className={`text-[11px] font-mono mt-0.5 ${textMuted}`}>-10% del peso</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono w-8 text-right">BO1</span>
                  <NumericStepper
                    value={currentState.set3Weight}
                    onChange={(v) => updateExState(currentExIdx, { set3Weight: v })}
                    unit="kg"
                    step={step}
                    isDark={isDark}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono w-8 text-right">BO2</span>
                  <NumericStepper
                    value={currentState.set4Weight}
                    onChange={(v) => updateExState(currentExIdx, { set4Weight: v })}
                    unit="kg"
                    step={step}
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Rest Timer ─────────────────────────────────────── */}
        <WorkoutTimer
          timerMode={timerMode}
          isElla={isElla}
          accentFrom={accentFrom}
          accentTo={accentTo}
          cardBg={cardBg}
          textPrimary={textPrimary}
          textMuted={textMuted}
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

        {/* Spacer */}
        <div className="h-36" />
      </div>

      {/* ── Bottom Navigation: Prev / Complete / Next ──────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 safe-bottom">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {/* Prev */}
            <button
              id="prev-exercise-btn"
              disabled={isFirstExercise}
              onClick={() => goToExercise(currentExIdx - 1)}
              className={`flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                isFirstExercise
                  ? "opacity-30 cursor-not-allowed"
                  : isDark
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <ArrowLeft size={14} /> Anterior
            </button>

            {/* Complete */}
            <button
              id="complete-exercise-btn"
              onClick={handleComplete}
              disabled={!canComplete && !isCompleted}
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

            {/* Next / Finish */}
            {isLastExercise ? (
              <button
                id="finish-workout-btn"
                onClick={finishWorkout}
                className="flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 bg-pink-500 text-white border-pink-400"
              >
                <Flame size={14} /> Terminar
              </button>
            ) : (
              <button
                id="next-exercise-btn"
                disabled={!nextAvailable}
                onClick={() => goToExercise(currentExIdx + 1)}
                className={`flex items-center justify-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                  nextAvailable
                    ? isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
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

  const startTimer = () => {
    setTimerDone(false);
    setTimerSeconds(totalSeconds);
    setTimerActive(true);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
    setTimerDone(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const circumference = 2 * Math.PI * 38;
  const progress = timerActive ? (timerSeconds / totalSeconds) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className={`mx-4 mt-4 mb-6 rounded-3xl border p-5 ${cardBg}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={`text-xs font-black tracking-widest uppercase ${textPrimary}`}>⏱ Descanso</p>
          <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>
            {timerMode === "normal" ? "Modo Normal · 3:00" : "Modo Rápido · 2:00"}
          </p>
        </div>
        {timerActive && (
          <button onClick={resetTimer} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-90 transition-all">
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#27272a" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="38" fill="none"
              stroke={timerDone ? "#10b981" : isElla ? "#ec4899" : "#f59e0b"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={timerActive ? strokeDashoffset : timerDone ? 0 : circumference}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {timerDone ? (
              <span className="text-2xl">✅</span>
            ) : (
              <span className={`text-lg font-black font-mono ${textPrimary}`}>
                {timerActive ? formatTime(timerSeconds) : formatTime(totalSeconds)}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1">
          {timerDone ? (
            <p className="text-sm font-bold text-emerald-500 mb-3">¡Descanso completo! 💪</p>
          ) : (
            <p className={`text-sm mb-3 ${textMuted}`}>
              {timerActive ? "Descansando..." : "Start para timer de descanso."}
            </p>
          )}
          <motion.button
            onClick={timerActive ? resetTimer : startTimer}
            whileTap={{ scale: 0.95 }}
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${
              timerActive
                ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white shadow-lg`
            }`}
          >
            {timerActive ? <><RotateCcw size={15} /> Cancelar</> : <><Zap size={15} /> {timerDone ? "Otro descanso" : "Start"}</>}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ─── Numeric Stepper ───────────────────────────────────────────────────
function NumericStepper({
  value, onChange, unit, step = 2.5, min = 0, highlight = false, isDark = false,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  step?: number;
  min?: number;
  highlight?: boolean;
  isDark?: boolean;
}) {
  const numVal = parseFloat(value) || 0;
  const btnBase = highlight
    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
    : isDark
      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
      : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark
      ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950"
      : "border-zinc-200 text-zinc-900 focus:border-zinc-400 bg-white";
  return (
    <div className="flex items-center gap-1.5">
      <motion.button type="button" onClick={() => onChange(String(Math.max(min, +(numVal - step).toFixed(1))))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}>
        <Minus size={14} strokeWidth={2.5} />
      </motion.button>
      <input type="text" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={unit}
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border outline-none transition-colors ${inputBase}`} />
      <motion.button type="button" onClick={() => onChange(String(+(numVal + step).toFixed(1)))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}>
        <Plus size={14} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}

function RepStepper({
  value, onChange, highlight = false, isDark = false,
}: {
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
  isDark?: boolean;
}) {
  const numVal = parseInt(value) || 0;
  const btnBase = highlight
    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
    : isDark
      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
      : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark
      ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950"
      : "border-zinc-200 text-zinc-900 focus:border-zinc-400 bg-white";
  return (
    <div className="flex items-center gap-1.5">
      <motion.button type="button" onClick={() => onChange(String(Math.max(0, numVal - 1)))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}>
        <Minus size={14} strokeWidth={2.5} />
      </motion.button>
      <input type="text" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Reps"
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border outline-none transition-colors ${inputBase}`} />
      <motion.button type="button" onClick={() => onChange(String(numVal + 1))} whileTap={{ scale: 0.85 }}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${btnBase}`}>
        <Plus size={14} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
