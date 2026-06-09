import { useState, useEffect, useRef, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Zap, Clock, Check, RotateCcw, ArrowLeft, ArrowRight,
  ChevronRight, Plus, Minus, Sparkles, Info, Flame, BarChart3, Play,
  GripVertical, Pencil,
} from "lucide-react";
import { getRoutineForProfile, getImageSrc } from "@/data/routines";
import type { ProfileId } from "@/data/routines";
import { gymDb } from "@/db/olympusDb";
import { addSession, getTodaySession } from "@/db/profileStore";
import type { ExerciseLog } from "@/db/profileStore";
import type { TimerMode, Theme } from "@/App";
import type { TabId } from "@/components/BottomNav";

interface WorkoutViewProps {
  profile: ProfileId;
  theme: Theme;
  timerMode: TimerMode;
  onTimerModeChange: (mode: TimerMode) => void;
  onNavigateToTab?: (tab: TabId) => void;
  unit: "kg" | "lbs";
}

interface ExerciseExecutionState {
  completed: boolean;
  warmupEnabled: boolean;
  warmupWeight: string;
  set1Weight: string;
  topSetWeight: string;
  topSetReps: string;
  set3Weight: string;
  set3Reps: string;
  set4Weight: string;
  set4Reps: string;
  set5Enabled: boolean;
  set5Weight: string;
  set5Reps: string;
}

type Phase = "select" | "prepare" | "execution";

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [locked]);
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 },
  }),
};

function evaluateReps(reps: number): { message: string; color: string; icon: string } | null {
  if (reps <= 0) return null;
  if (reps > 12) return { message: "Peso muy ligero. ¡Sube el peso de inmediato!", color: "text-blue-400", icon: "⚡" };
  if (reps === 12) return { message: "¡Dominado al fallo! Próxima sesión: Subir peso.", color: "text-emerald-400", icon: "🔥" };
  if (reps >= 8) return { message: "Zona óptima. Mantén el peso hasta alcanzar 12 reps.", color: "text-amber-400", icon: "🎯" };
  return { message: "Peso excesivo. Baja la carga para rango seguro (8-12).", color: "text-red-400", icon: "💡" };
}

function initExerciseState(): ExerciseExecutionState {
  return {
    completed: false,
    warmupEnabled: false,
    warmupWeight: "",
    set1Weight: "",
    topSetWeight: "",
    topSetReps: "",
    set3Weight: "",
    set3Reps: "",
    set4Weight: "",
    set4Reps: "",
    set5Enabled: false,
    set5Weight: "",
    set5Reps: "",
  };
}

function getPermanentRename(profile: ProfileId, originalName: string): string | null {
  try { return localStorage.getItem(`gym_perm_rename_${profile}_${originalName}`); } catch { return null; }
}

function setPermanentRename(profile: ProfileId, originalName: string, newName: string): void {
  localStorage.setItem(`gym_perm_rename_${profile}_${originalName}`, newName);
}

function removePermanentRename(profile: ProfileId, originalName: string): void {
  localStorage.removeItem(`gym_perm_rename_${profile}_${originalName}`);
}

function getExerciseOrder(profile: ProfileId, dayId: string): number[] | null {
  try {
    const raw = localStorage.getItem(`gym_ex_order_${profile}_${dayId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setExerciseOrder(profile: ProfileId, dayId: string, order: number[]): void {
  localStorage.setItem(`gym_ex_order_${profile}_${dayId}`, JSON.stringify(order));
}

export default function WorkoutView({ profile, theme, timerMode, onTimerModeChange, onNavigateToTab, unit }: WorkoutViewProps) {
  const isDark = theme === "dark";
  const isElla = profile === "ella";
  const routine = getRoutineForProfile(profile);

  const [phase, setPhase] = useState<Phase>("select");
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [exerciseStates, setExerciseStates] = useState<ExerciseExecutionState[]>([]);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const [repeatModalDayId, setRepeatModalDayId] = useState<string | null>(null);
  const [repeatIsSameDay, setRepeatIsSameDay] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);

  // ── Drag-and-Drop ───────────────────────────────────────────
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [reorderKey, setReorderKey] = useState(0);
  // Touch drag state (long-press activated)
  const touchDragRef = useRef<{
    idx: number;
    startY: number;
    currentY: number;
    longPressTimer: ReturnType<typeof setTimeout> | null;
    dragActivated: boolean;
  } | null>(null);
  const [touchDragOverIdx, setTouchDragOverIdx] = useState<number | null>(null);

  // ── Rename ──────────────────────────────────────────────────
  const [renameTarget, setRenameTarget] = useState<{
    idx: number; originalName: string; displayName: string;
  } | null>(null);
  const [renameModalInput, setRenameModalInput] = useState("");
  const [temporaryNames, setTemporaryNames] = useState<Record<number, string>>({});

  // ── Bidirectional Nav ───────────────────────────────────────
  const [hasStartedWorkout, setHasStartedWorkout] = useState(false);

  // ── Centered Error ──────────────────────────────────────────
  const [centerError, setCenterError] = useState<string | null>(null);

  // ── Active Workout Persistence ──────────────────────────────
  const SESSION_KEY = `gym_workout_session_${profile}`;
  const [savedSession, setSavedSession] = useState<{
    selectedDayId: string;
    currentExIdx: number;
    exerciseStates: ExerciseExecutionState[];
  } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      if (saved.selectedDayId) {
        setSavedSession(saved);
      }
    } catch { /* ignore */ }
  }, [SESSION_KEY]);

  useEffect(() => {
    if (phase === "execution") {
      localStorage.setItem(SESSION_KEY, JSON.stringify({
        selectedDayId,
        currentExIdx,
        exerciseStates,
      }));
    }
  }, [phase, currentExIdx, exerciseStates, selectedDayId, SESSION_KEY]);

  useEffect(() => {
    if (centerError) {
      const t = setTimeout(() => setCenterError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [centerError]);

  const clearSavedSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setSavedSession(null);
  };

  const selectedDay = routine.find((d) => d.id === selectedDayId) || null;

  // ── Re-ordered exercises (from drag) ────────────────────────
  const orderedExercises = useMemo(() => {
    if (!selectedDay) return [];
    const saved = getExerciseOrder(profile, selectedDay.id);
    if (!saved) return selectedDay.exercises;
    return saved.map((i) => selectedDay.exercises[i]).filter(Boolean);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, reorderKey]);

  // ── Display name helper ─────────────────────────────────────
  const getDisplayName = (idx: number, originalName: string): string => {
    return temporaryNames[idx] || getPermanentRename(profile, originalName) || originalName;
  };

  const isNameCustomized = (idx: number, originalName: string): boolean => {
    return (temporaryNames[idx] || getPermanentRename(profile, originalName)) !== undefined;
  };

  const isCalfSeated = (name: string): boolean => name.includes("Pantorrilla Sentado");

  useEffect(() => {
    if (validationToast) {
      const t = setTimeout(() => setValidationToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [validationToast]);

  useBodyScrollLock(!!repeatModalDayId || modeModalOpen || !!renameTarget || !!centerError);

  const goToPrepare = (dayId: string) => {
    const todaySession = getTodaySession(profile);
    if (todaySession) {
      setRepeatModalDayId(dayId);
      setRepeatIsSameDay(dayId === todaySession.dayId);
      return;
    }
    setSelectedDayId(dayId);
    setPhase("prepare");
  };

  const backToSelect = () => {
    clearSavedSession();
    setSelectedDayId(null);
    setPhase("select");
    setHasStartedWorkout(false);
  };

  const beginWorkout = () => {
    const day = selectedDay;
    if (!day) return;
    setModeModalOpen(false);
    setCurrentExIdx(0);
    setExerciseStates(day.exercises.map(() => initExerciseState()));
    setPhase("execution");
    setHasStartedWorkout(true);
  };

  const continueWorkoutFromPrepare = () => {
    if (exerciseStates.length > 0) {
      setPhase("execution");
    } else {
      beginWorkout();
    }
  };

  // ── Drag handlers (mouse + touch) ───────────────────────────
  const handleDragStart = (idx: number) => { setDragIdx(idx); };
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx && selectedDay) {
      const saved = getExerciseOrder(profile, selectedDay.id) || selectedDay.exercises.map((_, i) => i);
      const next = [...saved];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(dragOverIdx, 0, moved);
      setExerciseOrder(profile, selectedDay.id, next);
      setReorderKey((k) => k + 1);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleTouchStart = (idx: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchDragRef.current = {
      idx,
      startY: touch.clientY,
      currentY: touch.clientY,
      longPressTimer: setTimeout(() => {
        if (touchDragRef.current) {
          touchDragRef.current.dragActivated = true;
          setDragIdx(idx);
        }
      }, 450),
      dragActivated: false,
    };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const ref = touchDragRef.current;
    if (!ref) return;
    const touchY = e.touches[0].clientY;
    if (!ref.dragActivated) {
      const dy = Math.abs(touchY - ref.startY);
      if (dy > 10) {
        if (ref.longPressTimer) {
          clearTimeout(ref.longPressTimer);
          ref.longPressTimer = null;
        }
      }
      return;
    }
    ref.currentY = touchY;
    const cardEls = document.querySelectorAll("[data-exercise-card]");
    let overIdx: number | null = null;
    cardEls.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) overIdx = i;
    });
    setTouchDragOverIdx(overIdx);
  };
  const handleTouchEnd = () => {
    const ref = touchDragRef.current;
    if (ref) {
      if (ref.longPressTimer) {
        clearTimeout(ref.longPressTimer);
      }
      if (ref.dragActivated && touchDragOverIdx !== null && ref.idx !== touchDragOverIdx && selectedDay) {
        const saved = getExerciseOrder(profile, selectedDay.id) || selectedDay.exercises.map((_, i) => i);
        const next = [...saved];
        const [moved] = next.splice(ref.idx, 1);
        next.splice(touchDragOverIdx, 0, moved);
        setExerciseOrder(profile, selectedDay.id, next);
        setReorderKey((k) => k + 1);
      }
    }
    touchDragRef.current = null;
    setDragIdx(null);
    setTouchDragOverIdx(null);
  };

  // ── Rename handlers ─────────────────────────────────────────
  const openRenameModal = (idx: number, originalName: string) => {
    const current = getDisplayName(idx, originalName);
    setRenameTarget({ idx, originalName, displayName: current });
    setRenameModalInput(current);
  };

  const applyRenameTemp = () => {
    if (!renameTarget || !renameModalInput.trim()) return;
    setTemporaryNames((prev) => ({ ...prev, [renameTarget.idx]: renameModalInput.trim() }));
    setRenameTarget(null);
  };

  const applyRenamePerm = () => {
    if (!renameTarget || !renameModalInput.trim()) return;
    setPermanentRename(profile, renameTarget.originalName, renameModalInput.trim());
    setTemporaryNames((prev) => {
      const next = { ...prev };
      delete next[renameTarget.idx];
      return next;
    });
    setReorderKey((k) => k + 1);
    setRenameTarget(null);
  };

  const revertRename = () => {
    if (!renameTarget) return;
    removePermanentRename(profile, renameTarget.originalName);
    setTemporaryNames((prev) => {
      const next = { ...prev };
      delete next[renameTarget.idx];
      return next;
    });
    setReorderKey((k) => k + 1);
    setRenameTarget(null);
  };

  // ── Finish Workout ──────────────────────────────────────────
  const finishWorkout = async () => {
    if (!selectedDay) return;
    const mandatory = selectedDay.exercises.filter((ex) => !isCalfSeated(ex.name));
    const allMandatoryComplete = mandatory.every((_, idx) => {
      const realIdx = selectedDay.exercises.indexOf(mandatory[idx]);
      const st = exerciseStates[realIdx];
      const topDone = parseFloat(st.topSetWeight) > 0 && parseInt(st.topSetReps) > 0;
      const set2Done = parseFloat(st.set3Weight) > 0 && parseInt(st.set3Reps) > 0;
      return topDone && set2Done;
    });
    if (!allMandatoryComplete) {
      setCenterError("Completa al menos Top Set 1 y Set 2 en todos los ejercicios obligatorios");
      return;
    }
    const today = new Date().toLocaleDateString("en-CA");
    const completedExercises: ExerciseLog[] = selectedDay.exercises
      .map((ex, idx) => {
        const st = exerciseStates[idx];
        return {
          exerciseName: getDisplayName(idx, ex.name),
          set1Weight: st.set1Weight,
          topSetWeight: st.topSetWeight,
          topSetReps: st.topSetReps,
          set3Weight: st.set3Weight,
          set4Weight: st.set4Weight,
          warmupEnabled: st.warmupEnabled,
          warmupWeight: st.warmupWeight,
          isCompleted: st.completed,
          unit,
          set3Reps: st.set3Reps || undefined,
          set4Reps: st.set4Reps || undefined,
          set5Weight: st.set5Enabled ? (st.set5Weight || undefined) : undefined,
          set5Reps: st.set5Enabled ? (st.set5Reps || undefined) : undefined,
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
    clearSavedSession();
    setHasStartedWorkout(false);
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

  const currentEx = orderedExercises[currentExIdx] ?? null;
  const currentState = exerciseStates[currentExIdx] ?? null;

  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/40 border-zinc-800/60" : "bg-white border-zinc-200 shadow-sm";

  // ───── PHASE 1: SELECT ─────
  if (phase === "select") {
    return (
      <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
        <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-5 overflow-y-auto">
          <div>
            <p className={`text-xs font-mono uppercase tracking-widest ${textMuted}`}>Workout</p>
            <h1 className={`text-3xl font-black tracking-tighter ${textPrimary}`}>Elige tu entrenamiento</h1>
          </div>

          {savedSession && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => {
                const saved = savedSession;
                clearSavedSession();
                setSelectedDayId(saved.selectedDayId);
                setCurrentExIdx(saved.currentExIdx);
                setExerciseStates(saved.exerciseStates);
                setHasStartedWorkout(true);
                setPhase("execution");
              }}
              className="w-full text-left rounded-2xl overflow-hidden relative group shadow-lg"
              style={{ minHeight: "100px" }}
            >
              <div className={`absolute inset-0 ${isDark ? "bg-zinc-900" : "bg-white border border-zinc-200"} rounded-2xl`} />
              <div className={`absolute inset-0 bg-gradient-to-r from-pink-600/20 to-rose-700/10 rounded-2xl`} />
              <div className="relative p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
                    <Play size={20} className="text-pink-400 ml-0.5" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-mono font-bold tracking-widest uppercase ${textMuted}`}>Sesión Activa</p>
                    <h3 className={`text-lg font-black leading-tight ${isDark ? "text-white" : "text-zinc-900"}`}>Continuar Rutina</h3>
                    <p className={`text-xs mt-0.5 ${textMuted}`}>Toca para retomar donde lo dejaste</p>
                  </div>
                </div>
                <ChevronRight size={22} className={`group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2 ${
                  isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-zinc-300 group-hover:text-zinc-600"
                }`} />
              </div>
            </motion.button>
          )}

          <div className="space-y-3">
            {routine.map((day, idx) => {
              const imgSrc = getImageSrc(day.heroBg);
              const accentGradient = isElla ? "from-pink-600/70 to-rose-700/50" : "from-amber-500/70 to-orange-600/50";
              return (
                <motion.button
                  key={day.id}
                  id={`day-card-${idx}`}
                  onClick={() => goToPrepare(day.id)}
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

        {/* ── Repeat Routine Warning Modal ───────────────────── */}
        {repeatModalDayId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`mx-4 w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
              <h2 className={`text-lg font-black tracking-tight text-center mb-2 ${textPrimary}`}>
                Ya completaste una rutina hoy
              </h2>
              <p className={`text-xs font-mono text-center mb-5 ${textMuted}`}>
                ¿Deseas repetir de todas formas o prefieres gestionar tus registros?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const id = repeatModalDayId;
                    setRepeatModalDayId(null);
                    setSelectedDayId(id);
                    setPhase("prepare");
                  }}
                  className="w-full py-4 rounded-2xl font-black text-sm tracking-wide bg-pink-500 text-white border border-pink-400 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md"
                >
                  <Flame size={16} /> {repeatIsSameDay ? "Repetir Rutina" : "Empezar Nueva Rutina"}
                </button>
                <button
                  onClick={() => {
                    setRepeatModalDayId(null);
                    onNavigateToTab?.("analytics");
                  }}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-zinc-800 text-zinc-300 border-zinc-700"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}
                >
                  <BarChart3 size={16} /> Ir a Analíticas
                </button>
              </div>
              <button
                onClick={() => setRepeatModalDayId(null)}
                className={`w-full mt-3 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ───── PHASE 2: PREPARE ─────
  if (phase === "prepare" && selectedDay) {
    const exercisesToRender = orderedExercises.length > 0 ? orderedExercises : selectedDay.exercises;
    return (
      <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
        {/* Hero Background */}
        <div className="fixed inset-0">
          {(() => {
            const heroBg = getImageSrc(selectedDay.heroBg);
            return heroBg ? (
              <img src={heroBg} alt={selectedDay.title}
                className="w-full h-full object-cover object-center"
                style={{ filter: "blur(2px)", transform: "scale(1.06)" }}
              />
            ) : null;
          })()}
          {isDark
            ? <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40" />
            : <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/50" />
          }
        </div>

        {/* Scrollable content */}
        <div className="relative z-10 flex-1 overflow-y-auto max-w-2xl mx-auto w-full px-4 pt-4 pb-36">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={backToSelect}
              className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
                isDark
                  ? "bg-zinc-900/70 border-zinc-800/60 text-zinc-300"
                  : "bg-white/80 border-zinc-200 text-zinc-600 shadow-sm"
              }`}>
              <ArrowLeft size={18} />
            </button>
          </div>

          {/* Day info */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border backdrop-blur ${
                isDark ? "bg-zinc-900/60 border-zinc-800/60 text-zinc-400" : "bg-white/80 border-zinc-200 text-zinc-500"
              }`}>{selectedDay.dayLabel}</span>
              <span className={`text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border ${
                timerMode === "fast"
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/30"
                  : "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
              }`}>{timerMode === "fast" ? "⚡ Rápido" : "🟢 Normal"}</span>
            </div>

            <h1 className={`text-4xl font-black tracking-tighter leading-none mb-2 ${isDark ? "text-white" : "text-zinc-900"}`}>
              {selectedDay.title}
            </h1>
            <p className={`text-sm font-mono ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
              {selectedDay.subtitle} · {selectedDay.duration}
            </p>

            <div className="flex gap-3 mt-4">
              {[
                { label: "Ejercicios", value: exercisesToRender.length },
                { label: "Descanso", value: timerMode === "normal" ? "3 min" : "2 min" },
                { label: "Series", value: "3–4 c/u" },
              ].map(({ label, value }) => (
                <div key={label} className={`flex-1 text-center border rounded-xl px-3 py-2 ${
                  isDark ? "bg-zinc-900/80 border-zinc-700/60" : "bg-white/90 border-zinc-200 shadow-sm"
                }`}>
                  <p className={`text-[10px] font-mono ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>{label}</p>
                  <p className={`text-lg font-black ${isDark ? "text-white" : "text-zinc-900"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Exercise List (draggable) */}
          <div className="space-y-2">
            {exercisesToRender.map((exercise, idx) => {
              const originalName = exercise.name;
              const displayName = getDisplayName(idx, originalName);
              const imgSrc = getImageSrc(exercise.imageKey);
              const tagAccent = isElla
                ? "bg-pink-500/10 text-pink-500 border-pink-500/20"
                : "bg-amber-500/10 text-amber-500 border-amber-500/20";
              const isOptional = isCalfSeated(originalName);
              return (
                <div
                  key={idx}
                  data-exercise-card
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(idx, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`rounded-2xl p-3 flex items-center gap-3 border transition-all select-none ${
                    ((dragOverIdx === idx && dragIdx !== idx) || (touchDragOverIdx === idx && dragIdx !== idx))
                      ? "border-pink-400/60 shadow-lg scale-[1.02]"
                      : isDark ? "bg-zinc-900/80 border-zinc-700/60" : "bg-white/90 border-zinc-200 shadow-sm"
                  } ${dragIdx === idx ? "opacity-50" : ""}`}
                >
                  {/* Drag handle */}
                  <div className="flex-shrink-0 cursor-grab active:cursor-grabbing touch-none p-1 rounded-lg hover:bg-zinc-700/30">
                    <GripVertical size={16} className={isDark ? "text-zinc-600" : "text-zinc-400"} />
                  </div>

                  {/* Image — hidden if name customized */}
                  {!isNameCustomized(idx, originalName) ? (
                    <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${isDark ? "bg-zinc-800" : "bg-zinc-100"}`}>
                      {imgSrc
                        ? <img src={imgSrc} alt={displayName} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-base">💪</div>
                      }
                    </div>
                  ) : null}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {exercise.isSuperset && (
                        <span className={`text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full border ${tagAccent}`}>⛓️ SS</span>
                      )}
                      {exercise.isDropset && (
                        <span className="text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">💥 DROP</span>
                      )}
                      {isOptional && (
                        <span className="text-[9px] font-mono font-black tracking-widest uppercase px-1.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">(Opcional)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className={`leading-tight truncate ${isNameCustomized(idx, originalName) ? "text-lg font-black" : "text-sm font-semibold"} ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                        {displayName}
                      </p>
                      <button
                        onClick={(e) => { e.preventDefault(); openRenameModal(idx, originalName); }}
                        className="p-1 rounded-lg hover:bg-zinc-700/30 transition-colors flex-shrink-0"
                      >
                        <Pencil size={11} className={isDark ? "text-zinc-500" : "text-zinc-400"} />
                      </button>
                    </div>
                    {exercise.notes && !isNameCustomized(idx, originalName) && (
                      <p className={`text-[10px] mt-0.5 truncate ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{exercise.notes}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded-full border flex-shrink-0 ${
                    isDark ? "bg-zinc-800/80 text-zinc-500 border-zinc-700" : "bg-zinc-100 text-zinc-400 border-zinc-200"
                  }`}>
                    {idx + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fixed CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 64px)" }}>
          <div className="max-w-2xl mx-auto pointer-events-auto space-y-2">
            {hasStartedWorkout && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={continueWorkoutFromPrepare}
                whileTap={{ scale: 0.95 }}
                className={`w-full font-black text-sm tracking-wide py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 border ${
                  isDark
                    ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                    : "bg-white text-zinc-800 border-zinc-200"
                }`}
              >
                <Play size={16} /> Continuar con la rutina
              </motion.button>
            )}
            <motion.button
              id="start-workout-btn"
              onClick={() => setModeModalOpen(true)}
              whileTap={{ scale: 0.95 }}
              className={`w-full font-black text-base tracking-wide py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-2 ${
                isDark
                  ? "bg-white text-zinc-950 shadow-black/50"
                  : "bg-zinc-900 text-white shadow-zinc-900/30"
              }`}>
              <Zap size={18} /> {hasStartedWorkout ? "Reiniciar Rutina" : "Iniciar Rutina"}
            </motion.button>
          </div>
        </div>

        {/* Mode Selection Modal */}
        {modeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`mx-4 w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
              <h2 className={`text-lg font-black tracking-tight text-center mb-1 ${textPrimary}`}>
                ¿Cómo quieres entrenar hoy?
              </h2>
              <p className={`text-xs font-mono text-center mb-5 ${textMuted}`}>
                Selecciona el tiempo de descanso entre series
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { onTimerModeChange("normal"); beginWorkout(); }}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-white text-zinc-950 border-zinc-600 shadow-md"
                      : "bg-zinc-900 text-white border-zinc-300 shadow-md"
                  }`}
                >
                  <Clock size={16} /> Modo Normal · 3 min descanso
                </button>
                <button
                  onClick={() => { onTimerModeChange("fast"); beginWorkout(); }}
                  className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-amber-50 text-amber-600 border-amber-200"
                  }`}
                >
                  <Zap size={16} /> Modo Rápido · 2 min descanso
                </button>
              </div>
              <button
                onClick={() => setModeModalOpen(false)}
                className={`w-full mt-3 py-3 rounded-2xl text-xs font-bold transition-colors ${
                  isDark ? "text-zinc-500 hover:text-zinc-300" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* ── Rename Modal ──────────────────────────────────────── */}
        {renameTarget && (() => {
          const isDirty = renameModalInput !== renameTarget.displayName;
          const hasCustomName = temporaryNames[renameTarget.idx] !== undefined || getPermanentRename(profile, renameTarget.originalName) !== null;
          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className={`mx-4 w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
              <h2 className={`text-lg font-black tracking-tight text-center mb-2 ${textPrimary}`}>
                Editar nombre
              </h2>
              <p className={`text-xs font-mono text-center mb-4 ${textMuted}`}>
                "{renameTarget.originalName}"
              </p>
              <input
                type="text"
                value={renameModalInput}
                onChange={(e) => setRenameModalInput(e.target.value)}
                placeholder="Nuevo nombre del ejercicio"
                autoFocus
                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-colors mb-4 ${
                  isDark
                    ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-500"
                    : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400"
                }`}
              />
              <div className="space-y-2">
                <button onClick={applyRenameTemp} disabled={!isDirty}
                  className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                    !isDirty
                      ? "opacity-40 cursor-not-allowed"
                      : isDark
                        ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}>
                  Cambio Temporal (solo hoy)
                </button>
                <button onClick={applyRenamePerm} disabled={!isDirty}
                  className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                    !isDirty
                      ? "opacity-40 cursor-not-allowed bg-pink-500/20 text-pink-300 border-pink-400/30"
                      : "bg-pink-500 text-white border-pink-400"
                  }`}>
                  Cambio Permanente
                </button>
                <button onClick={revertRename} disabled={!isDirty && !hasCustomName}
                  className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                    !isDirty && !hasCustomName
                      ? "opacity-40 cursor-not-allowed"
                      : isDark
                        ? "border-red-900/40 text-red-400 hover:bg-red-950/20"
                        : "border-red-200 text-red-500 hover:bg-red-50"
                  }`}>
                  Revertir a nombre original
                </button>
              </div>
              <button
                onClick={() => setRenameTarget(null)}
                className={`w-full mt-4 py-4 rounded-2xl font-bold text-base tracking-wide transition-colors border-2 ${
                  isDark
                    ? "bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700"
                    : "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200"
                }`}>
                Cancelar
              </button>
            </div>
          </div>
          );
        })()}
      </div>
    );
  }

  // ───── PHASE 3: EXECUTION ─────
  if (!selectedDay || !currentEx || !currentState) return null;

  const totalExercises = orderedExercises.length;
  const isLastExercise = currentExIdx === totalExercises - 1;
  const isFirstExercise = currentExIdx === 0;

  const isOptional = isCalfSeated(currentEx.name);
  const topSetDone = parseFloat(currentState.topSetWeight) > 0 && parseInt(currentState.topSetReps) > 0;
  const backoff1Done = parseFloat(currentState.set3Weight) > 0 && parseInt(currentState.set3Reps) > 0;
  // 2-set minimum: Top Set 1 + Set 2 (optional exercises are always valid)
  const canComplete = isOptional || (topSetDone && backoff1Done);
  const isCompleted = currentState.completed;
  const nextAvailable = isCompleted;

  const handleComplete = async () => {
    if (isCompleted) {
      updateExState(currentExIdx, { completed: false });
      return;
    }
    if (!canComplete) {
      setValidationToast(isOptional ? "" : "Completa Top Set 1 y Set 2 con peso y reps > 0");
      return;
    }
    updateExState(currentExIdx, { completed: true });
    const today = new Date().toLocaleDateString("en-CA");
    try {
      await gymDb.addWorkoutLog({
        date: today,
        timestamp: Date.now(),
        profile,
        dayId: selectedDay.id,
        exerciseName: getDisplayName(currentExIdx, currentEx.name),
        set1Weight: currentState.set1Weight,
        topSetWeight: currentState.topSetWeight,
        topSetReps: currentState.topSetReps,
        set3Weight: currentState.set3Weight,
        set4Weight: currentState.set4Weight,
        unit,
      });
    } catch (e) {
      console.error("Save error", e);
    }
  };

  const goToExercise = (idx: number) => setCurrentExIdx(idx);

  const displayName = getDisplayName(currentExIdx, currentEx.name);
  const nameCustomized = isNameCustomized(currentExIdx, currentEx.name);
  const imgSrc = !nameCustomized ? getImageSrc(currentEx.imageKey) : null;
  const accentFrom = isElla ? "from-pink-600" : "from-amber-500";
  const accentTo = isElla ? "to-rose-700" : "to-orange-600";
  const accentText = isElla ? "text-pink-400" : "text-amber-400";
  const accentBorder = isElla ? "border-pink-500/40" : "border-amber-500/40";
  const accentBg = isElla ? "bg-pink-500/10" : "bg-amber-500/10";

  const repFeedback = evaluateReps(parseInt(currentState.topSetReps) || 0);
  const step = unit === "lbs" ? 5 : 2.5;

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      {/* Toast */}
      {validationToast && validationToast.length > 0 && (
        <div className="fixed top-4 left-4 right-4 z-50 max-w-2xl mx-auto">
          <div className="bg-red-500/90 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-2xl text-center backdrop-blur-sm">
            {validationToast}
          </div>
        </div>
      )}

      {/* ── Centered Error ──────────────────────────────── */}
      {centerError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-red-500/90 text-white text-2xl font-black px-8 py-10 rounded-3xl shadow-2xl text-center max-w-sm mx-4 backdrop-blur-md leading-relaxed">
            {centerError}
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────── */}
      <header className={`sticky top-0 z-20 backdrop-blur-xl border-b ${isDark ? "bg-zinc-950/95 border-zinc-900/80" : "bg-white/95 border-zinc-200"}`}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => { setPhase("prepare"); }}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center active:scale-90 transition-all ${
              isDark ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-zinc-100 border-zinc-200 text-zinc-600"
            }`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 text-center">
            <p className={`text-[10px] font-mono uppercase tracking-widest ${textMuted}`}>
              {selectedDay.dayLabel} · {currentExIdx + 1}/{totalExercises}
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className={`text-sm font-black leading-tight truncate px-1 ${textPrimary}`}>{displayName}</h1>
              <button
                onClick={() => openRenameModal(currentExIdx, currentEx.name)}
                className="p-1 rounded-lg hover:bg-zinc-700/30 transition-colors flex-shrink-0"
              >
                <Pencil size={11} className={isDark ? "text-zinc-500" : "text-zinc-400"} />
              </button>
            </div>
          </div>
          <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center text-xs font-black font-mono ${
            isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-zinc-100 border-zinc-200 text-zinc-500"
          }`}>
            {currentExIdx + 1}/{totalExercises}
          </div>
        </div>
        {/* Progress dots */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
          {orderedExercises.map((_, idx) => {
            const exState = exerciseStates[idx];
            const isActive = idx === currentExIdx;
            return (
              <button key={idx} onClick={() => goToExercise(idx)}
                className={`w-6 h-1.5 rounded-full transition-all flex-shrink-0 ${
                  isActive ? "bg-pink-500 w-8"
                    : exState?.completed ? "bg-emerald-500"
                    : isDark ? "bg-zinc-700" : "bg-zinc-300"
                }`} />
            );
          })}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">
        {/* ── Movement Demo ──────────────────────────── */}
        <div className={`relative mx-4 mt-4 rounded-3xl overflow-hidden ${isDark ? "bg-zinc-900" : "bg-zinc-100 border border-zinc-200"}`} style={{ height: "200px" }}>
          {imgSrc ? (
            <img src={imgSrc} alt={displayName} className="w-full h-full object-contain p-4" />
          ) : nameCustomized ? (
            <div className="w-full h-full flex items-center justify-center p-6">
              <span className={`text-2xl font-black text-center leading-tight ${isDark ? "text-zinc-100" : "text-zinc-800"}`}>{displayName}</span>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <span className="text-5xl">💪</span>
            </div>
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
          {isOptional && (
            <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">(Opcional)</span>
          )}
          {currentEx.notes && !currentEx.isSuperset && !currentEx.isDropset && !isOptional && (
            <span className={`text-[10px] font-mono flex items-center gap-1 ${textMuted}`}><Info size={10} /> {currentEx.notes}</span>
          )}
        </div>

        {/* ── Sets & Reps Module ─────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.1 }}
          className={`mx-4 mt-4 rounded-3xl border overflow-hidden ${cardBg}`}>
          <div className={`px-5 py-4 border-b flex items-center justify-between ${isDark ? "border-zinc-800/60" : "border-zinc-100"}`}>
            <div>
              <p className={`text-xs font-black tracking-widest uppercase ${textPrimary}`}>SETS & REPS</p>
              <p className={`text-[10px] font-mono mt-0.5 ${textMuted}`}>
                {currentState.warmupEnabled ? "Calentamiento + 3-4 series" : "3-4 series"}
                {isOptional && " (Opcional)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono ${textMuted}`}>Warm-Up</span>
              <button onClick={() => updateExState(currentExIdx, { warmupEnabled: !currentState.warmupEnabled })}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  currentState.warmupEnabled ? `bg-gradient-to-r ${accentFrom} ${accentTo}` : "bg-zinc-700"
                }`}>
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
              <NumericStepper value={currentState.warmupWeight}
                onChange={(v) => updateExState(currentExIdx, { warmupWeight: v })} unit={unit} step={step} isDark={isDark} />
            </div>
          )}

          {/* Top Set 1 */}
          <div className={`px-5 py-4 border-b border-l-2 ${accentBg} ${accentBorder} ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <p className={`text-sm font-black mb-3 ${accentText} flex items-center gap-1.5`}>
              Top Set 1 <Sparkles size={13} className="animate-pulse" />
            </p>
            <WeightRepRow
              weight={currentState.topSetWeight} onWeightChange={(v) => updateExState(currentExIdx, { topSetWeight: v })}
              reps={currentState.topSetReps} onRepsChange={(v) => updateExState(currentExIdx, { topSetReps: v })}
              unit={unit} step={step} highlight isDark={isDark}
            />
            {repFeedback && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2">
                <span className="text-base">{repFeedback.icon}</span>
                <p className={`text-xs font-semibold ${repFeedback.color}`}>{repFeedback.message}</p>
              </div>
            )}
          </div>

          {/* Set 2 */}
          <div className={`px-5 py-4 border-b ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Set 2</p>
            <WeightRepRow
              weight={currentState.set3Weight} onWeightChange={(v) => updateExState(currentExIdx, { set3Weight: v })}
              reps={currentState.set3Reps} onRepsChange={(v) => updateExState(currentExIdx, { set3Reps: v })}
              unit={unit} step={step} isDark={isDark}
            />
          </div>

          {/* Set 3 */}
          <div className={`px-5 py-4 border-b ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <p className={`text-sm font-semibold mb-3 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Set 3</p>
            <WeightRepRow
              weight={currentState.set4Weight} onWeightChange={(v) => updateExState(currentExIdx, { set4Weight: v })}
              reps={currentState.set4Reps} onRepsChange={(v) => updateExState(currentExIdx, { set4Reps: v })}
              unit={unit} step={step} isDark={isDark}
            />
          </div>

          {/* Set 4 (Opcional) */}
          <div className={`px-5 py-4 ${currentState.set5Enabled ? "border-b" : ""} ${isDark ? "border-zinc-800/40" : "border-zinc-100"}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-semibold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Set 4 (Opcional)</p>
              <button onClick={() => updateExState(currentExIdx, { set5Enabled: !currentState.set5Enabled })}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition-colors ${
                  currentState.set5Enabled
                    ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
                    : isDark ? "border-zinc-700 text-zinc-400" : "border-zinc-200 text-zinc-500"
                }`}>
                {currentState.set5Enabled ? "Quitar" : "+ Añadir"}
              </button>
            </div>
            {currentState.set5Enabled && (
              <WeightRepRow
                weight={currentState.set5Weight} onWeightChange={(v) => updateExState(currentExIdx, { set5Weight: v })}
                reps={currentState.set5Reps} onRepsChange={(v) => updateExState(currentExIdx, { set5Reps: v })}
                unit={unit} step={step} isDark={isDark}
              />
            )}
          </div>
        </motion.div>

        {/* ── Rest Timer ─────────────────────────────────────── */}
        <WorkoutTimer timerMode={timerMode} isElla={isElla} accentFrom={accentFrom} accentTo={accentTo}
          cardBg={cardBg} textPrimary={textPrimary} textMuted={textMuted} />

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

      {/* ── Bottom Nav: Prev / Complete / Next ──────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 16px) + 72px)" }}>
        <div className="max-w-2xl mx-auto pointer-events-auto">
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button id="prev-exercise-btn" disabled={isFirstExercise}
              onClick={() => goToExercise(currentExIdx - 1)}
              className={`flex items-center justify-center gap-1 px-3 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                isFirstExercise ? "opacity-30 cursor-not-allowed"
                  : isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}>
              <ArrowLeft size={14} />
            </button>

            {/* Complete */}
            <button id="complete-exercise-btn" onClick={handleComplete}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-black tracking-wide transition-all active:scale-95 ${
                isCompleted ? "bg-emerald-500 text-white"
                  : canComplete ? `bg-gradient-to-r ${accentFrom} ${accentTo} text-white`
                  : isDark ? "bg-zinc-800 text-zinc-500" : "bg-zinc-200 text-zinc-400"
              }`}>
              <Check size={16} strokeWidth={3} />
              {isCompleted ? "Completado ✓" : "Completar Ejercicio"}
            </button>

            {/* Next / Finish */}
            {isLastExercise ? (
              <button id="finish-workout-btn" onClick={finishWorkout}
                className="flex items-center justify-center gap-1 px-3 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 bg-pink-500 text-white border-pink-400">
                <Flame size={14} /> Terminar
              </button>
            ) : (
              <button id="next-exercise-btn" disabled={!nextAvailable}
                onClick={() => goToExercise(currentExIdx + 1)}
                className={`flex items-center justify-center gap-1 px-3 py-3 rounded-2xl text-xs font-bold border transition-all active:scale-95 ${
                  nextAvailable
                    ? isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    : "opacity-30 cursor-not-allowed"
                }`}>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Rename Modal (Phase 3) ────────────────────────────── */}
      {renameTarget && (() => {
        const isDirty = renameModalInput !== renameTarget.displayName;
        const hasCustomName = temporaryNames[renameTarget.idx] !== undefined || getPermanentRename(profile, renameTarget.originalName) !== null;
        return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`mx-4 w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"}`}>
            <h2 className={`text-lg font-black tracking-tight text-center mb-2 ${textPrimary}`}>
              Editar nombre
            </h2>
            <p className={`text-xs font-mono text-center mb-4 ${textMuted}`}>
              "{renameTarget.originalName}"
            </p>
            <input
              type="text"
              value={renameModalInput}
              onChange={(e) => setRenameModalInput(e.target.value)}
              placeholder="Nuevo nombre del ejercicio"
              autoFocus
              className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition-colors mb-4 ${
                isDark
                  ? "bg-zinc-800 border-zinc-700 text-zinc-100 focus:border-zinc-500"
                  : "bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-zinc-400"
              }`}
            />
            <div className="space-y-2">
              <button onClick={applyRenameTemp} disabled={!isDirty}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                  !isDirty
                    ? "opacity-40 cursor-not-allowed"
                    : isDark
                      ? "bg-zinc-800 text-zinc-200 border-zinc-700"
                      : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}>
                Cambio Temporal (solo hoy)
              </button>
              <button onClick={applyRenamePerm} disabled={!isDirty}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                  !isDirty
                    ? "opacity-40 cursor-not-allowed bg-pink-500/20 text-pink-300 border-pink-400/30"
                    : "bg-pink-500 text-white border-pink-400"
                }`}>
                Cambio Permanente
              </button>
              <button onClick={revertRename} disabled={!isDirty && !hasCustomName}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide border transition-all active:scale-95 ${
                  !isDirty && !hasCustomName
                    ? "opacity-40 cursor-not-allowed"
                    : isDark
                      ? "border-red-900/40 text-red-400 hover:bg-red-950/20"
                      : "border-red-200 text-red-500 hover:bg-red-50"
                }`}>
                Revertir a nombre original
              </button>
            </div>
            <button
              onClick={() => setRenameTarget(null)}
              className={`w-full mt-4 py-4 rounded-2xl font-bold text-base tracking-wide transition-colors border-2 ${
                isDark
                  ? "bg-zinc-800 text-zinc-200 border-zinc-600 hover:bg-zinc-700"
                  : "bg-zinc-100 text-zinc-800 border-zinc-300 hover:bg-zinc-200"
              }`}>
              Cancelar
            </button>
          </div>
        </div>
        );
      })()}
    </div>
  );
}

// ─── Weight + Rep Row ────────────────────────────────────────────────
function WeightRepRow({ weight, onWeightChange, reps, onRepsChange, unit, step, highlight, isDark }: {
  weight: string; onWeightChange: (v: string) => void;
  reps: string; onRepsChange: (v: string) => void;
  unit: string; step: number; highlight?: boolean; isDark: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Peso ({unit})</p>
        <NumericStepper value={weight} onChange={onWeightChange} unit={unit} step={step} highlight={highlight} isDark={isDark} />
      </div>
      <div className="text-zinc-700 font-black text-xl">×</div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Reps</p>
        <RepStepper value={reps} onChange={onRepsChange} highlight={highlight} isDark={isDark} />
      </div>
    </div>
  );
}

// ─── Workout Timer ─────────────────────────────────────────────────────
function WorkoutTimer({ timerMode, isElla, accentFrom, accentTo, cardBg, textPrimary, textMuted }: {
  timerMode: TimerMode; isElla: boolean; accentFrom: string; accentTo: string;
  cardBg: string; textPrimary: string; textMuted: string;
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
          if (s <= 1) { clearInterval(intervalRef.current!); setTimerActive(false); setTimerDone(true); return 0; }
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
            <circle cx="50" cy="50" r="38" fill="none"
              stroke={timerDone ? "#10b981" : isElla ? "#ec4899" : "#f59e0b"}
              strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference}
              strokeDashoffset={timerActive ? strokeDashoffset : timerDone ? 0 : circumference}
              className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {timerDone ? <span className="text-2xl">✅</span> : (
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
            <p className={`text-sm mb-3 ${textMuted}`}>{timerActive ? "Descansando..." : "Start para timer de descanso."}</p>
          )}
          <motion.button onClick={timerActive ? resetTimer : startTimer} whileTap={{ scale: 0.95 }}
            className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-colors flex items-center justify-center gap-2 ${
              timerActive ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white shadow-lg`
            }`}>
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
    : isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950"
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

function RepStepper({ value, onChange, highlight = false, isDark = false }: {
  value: string; onChange: (v: string) => void; highlight?: boolean; isDark?: boolean;
}) {
  const numVal = parseInt(value) || 0;
  const btnBase = highlight
    ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
    : isDark ? "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200";
  const inputBase = highlight
    ? "border-amber-500/50 text-amber-300 focus:border-amber-400 bg-zinc-950"
    : isDark ? "border-zinc-700/60 text-zinc-100 focus:border-zinc-500 bg-zinc-950"
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