import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Sparkles, Zap, Check, RotateCcw, Plus, Minus, Info } from "lucide-react";
import { getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay, ExerciseConfig } from "@/data/routines";
import { gymDb } from "@/db/olympusDb";
import type { TimerMode } from "@/App";

interface ExerciseDetailProps {
  profile: ProfileId;
  day: RoutineDay;
  exercise: ExerciseConfig;
  unit: "kg" | "lbs";
  timerMode: TimerMode;
  onBack: () => void;
}

// Evaluate reps against 8-12 rule
function evaluateReps(reps: number): { message: string; color: string; icon: string } | null {
  if (reps <= 0) return null;
  if (reps > 12) return { message: "Peso muy ligero. ¡Sube el peso de inmediato!", color: "text-blue-400", icon: "⚡" };
  if (reps === 12) return { message: "¡Dominado al fallo! Próxima sesión: Subir peso.", color: "text-emerald-400", icon: "🔥" };
  if (reps >= 8) return { message: "Zona óptima. Mantén el peso hasta alcanzar 12 reps.", color: "text-amber-400", icon: "🎯" };
  return { message: "Peso excesivo. Baja la carga para rango seguro (8-12).", color: "text-red-400", icon: "💡" };
}

// +/- tactile numeric input
function NumericStepper({
  value, onChange, placeholder, step = 2.5, min = 0, highlight = false
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  step?: number;
  min?: number;
  highlight?: boolean;
}) {
  const numVal = parseFloat(value) || 0;

  const decrement = () => {
    const next = Math.max(min, numVal - step);
    onChange(next % 1 === 0 ? String(next) : next.toFixed(1));
  };
  const increment = () => {
    const next = numVal + step;
    onChange(next % 1 === 0 ? String(next) : next.toFixed(1));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={decrement}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
          highlight
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>

      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border bg-zinc-950 outline-none transition-colors ${
          highlight
            ? "border-amber-500/50 text-amber-300 focus:border-amber-400"
            : "border-zinc-700/60 text-zinc-100 focus:border-zinc-500"
        }`}
      />

      <button
        type="button"
        onClick={increment}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
          highlight
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

// Rep stepper (integer, step=1)
function RepStepper({
  value, onChange, highlight = false
}: {
  value: string;
  onChange: (v: string) => void;
  highlight?: boolean;
}) {
  const numVal = parseInt(value) || 0;
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(String(Math.max(0, numVal - 1)))}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
          highlight
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        <Minus size={14} strokeWidth={2.5} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Reps"
        className={`w-16 h-9 text-center text-sm font-black rounded-xl border bg-zinc-950 outline-none transition-colors ${
          highlight
            ? "border-amber-500/50 text-amber-300 focus:border-amber-400"
            : "border-zinc-700/60 text-zinc-100 focus:border-zinc-500"
        }`}
      />
      <button
        type="button"
        onClick={() => onChange(String(numVal + 1))}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all active:scale-90 ${
          highlight
            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20"
            : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
        }`}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default function ExerciseDetail({
  profile, day, exercise, unit, timerMode, onBack
}: ExerciseDetailProps) {
  const isElla = profile === "ella";
  const accentFrom = isElla ? "from-pink-600" : "from-amber-500";
  const accentTo = isElla ? "to-rose-700" : "to-orange-600";
  const accentText = isElla ? "text-pink-400" : "text-amber-400";
  const accentBorder = isElla ? "border-pink-500/40" : "border-amber-500/40";
  const accentBg = isElla ? "bg-pink-500/10" : "bg-amber-500/10";

  const imgSrc = getImageSrc(exercise.imageKey);

  // Form state
  const [warmupEnabled, setWarmupEnabled] = useState(false);
  const [warmupWeight, setWarmupWeight] = useState("");
  const [set1Weight, setSet1Weight] = useState("");
  const [topSetWeight, setTopSetWeight] = useState("");
  const [topSetReps, setTopSetReps] = useState("");
  const [set3Weight, setSet3Weight] = useState("");
  const [set4Weight, setSet4Weight] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);

  // Timer state
  const totalSeconds = timerMode === "normal" ? 180 : 120;
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // View toggle
  const [activeView, setActiveView] = useState<"demo" | "muscle">("demo");

  // Load from IndexedDB on mount
  useEffect(() => {
    async function load() {
      try {
        const record = await gymDb.getSetInputs(profile, exercise.name);
        if (record) {
          setWarmupEnabled(record.warmupEnabled ?? false);
          setWarmupWeight(record.set1Weight || "");
          setSet1Weight(record.set1Weight || "");
          setTopSetWeight(record.topSetWeight || "");
          setTopSetReps(record.topSetReps || "");
          setSet3Weight(record.set3Weight || "");
          setSet4Weight(record.set4Weight || "");
          setIsCompleted(record.isCompleted || false);
        }
      } catch (e) {
        console.error("Load error", e);
      }
    }
    load();
  }, [profile, exercise.name]);

  const save = async (overrides: Record<string, unknown> = {}) => {
    try {
      const key = `${profile}_${exercise.name.replace(/\s+/g, "_").toLowerCase()}`;
      await gymDb.saveSetInputs({
        key,
        profile,
        exerciseName: exercise.name,
        set1Weight: overrides.set1Weight as string ?? set1Weight,
        topSetWeight: overrides.topSetWeight as string ?? topSetWeight,
        topSetReps: overrides.topSetReps as string ?? topSetReps,
        set3Weight: overrides.set3Weight as string ?? set3Weight,
        set4Weight: overrides.set4Weight as string ?? set4Weight,
        warmupEnabled: overrides.warmupEnabled as boolean ?? warmupEnabled,
        isCompleted: overrides.isCompleted as boolean ?? isCompleted,
      });
    } catch (e) {
      console.error("Save error", e);
    }
  };

  // Timer logic
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimerSeconds((s) => {
          if (s <= 1) {
            setTimerActive(false);
            setTimerDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
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

  // Circle progress
  const circumference = 2 * Math.PI * 38;
  const progress = timerActive ? (timerSeconds / totalSeconds) : 0;
  const strokeDashoffset = circumference - progress * circumference;

  // Rep feedback
  const repFeedback = evaluateReps(parseInt(topSetReps) || 0);

  const handleComplete = async () => {
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    await save({ isCompleted: newCompleted });

    if (newCompleted) {
      const today = new Date().toLocaleDateString("en-CA");
      await gymDb.addWorkoutLog({
        date: today,
        timestamp: Date.now(),
        profile,
        dayId: day.id,
        exerciseName: exercise.name,
        set1Weight,
        topSetWeight,
        topSetReps,
        set3Weight,
        set4Weight,
        unit,
      });
      window.dispatchEvent(new Event("gym_db_update"));
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-900/80 safe-top">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            id="exercise-back-btn"
            onClick={onBack}
            className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white active:scale-90 transition-all"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="flex-1 text-center">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{day.dayLabel}</p>
            <h1 className="text-sm font-black text-zinc-100 leading-tight truncate px-2">{exercise.name}</h1>
          </div>

          {/* Complete checkmark */}
          <button
            id="complete-exercise-btn"
            onClick={handleComplete}
            className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${
              isCompleted
                ? "bg-emerald-500 border-emerald-400 text-white"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-emerald-700 hover:text-emerald-500"
            }`}
          >
            <Check size={17} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* ─── Scrollable Content ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto max-w-2xl mx-auto w-full">

        {/* Exercise Image Viewer */}
        <div className="relative bg-zinc-900 mx-4 mt-4 rounded-3xl overflow-hidden" style={{ height: "220px" }}>
          {activeView === "demo" ? (
            imgSrc ? (
              <img
                src={imgSrc}
                alt={exercise.name}
                className="w-full h-full object-contain p-4"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-600">
                <div className="text-center">
                  <span className="text-5xl">💪</span>
                  <p className="text-xs mt-2 font-mono text-zinc-600">Sin imagen disponible</p>
                </div>
              </div>
            )
          ) : (
            // Muscle view placeholder (anatomical)
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
              <span className="text-5xl mb-3">🫀</span>
              <p className="text-sm font-semibold text-zinc-400">Mapa Muscular</p>
              <p className="text-xs text-zinc-600 mt-1 font-mono">{exercise.notes || "Músculos activados en este movimiento"}</p>
            </div>
          )}

          {/* Gradient bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent" />
        </div>

        {/* View Toggle Pill */}
        <div className="flex mx-4 mt-3 bg-zinc-900/80 rounded-2xl p-1 border border-zinc-800/60">
          {(["demo", "muscle"] as const).map((v) => (
            <button
              key={v}
              id={`view-toggle-${v}`}
              onClick={() => setActiveView(v)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeView === v
                  ? "bg-zinc-800 text-zinc-100 shadow"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {v === "demo" ? "Movement Demo" : "Muscle View"}
            </button>
          ))}
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-2 px-4 mt-3">
          {exercise.isSuperset && (
            <span className={`text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full ${accentBg} ${accentText} border ${accentBorder}`}>
              ⛓️ SUPERSET
            </span>
          )}
          {exercise.isDropset && (
            <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
              💥 DROPSET
            </span>
          )}
          {exercise.notes && !exercise.isSuperset && !exercise.isDropset && (
            <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
              <Info size={10} /> {exercise.notes}
            </span>
          )}
        </div>

        {/* ─── SETS & REPS Module ───────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 rounded-3xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
          
          {/* Module Header */}
          <div className="px-5 py-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-black tracking-widest text-zinc-300 uppercase">SETS & REPS</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {warmupEnabled ? "Calentamiento + 3-4 series" : "3-4 series al fallo"}
              </p>
            </div>
            {/* Warm-up toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 font-mono">Warm-Up</span>
              <button
                id="warmup-toggle"
                onClick={async () => {
                  const next = !warmupEnabled;
                  setWarmupEnabled(next);
                  await save({ warmupEnabled: next });
                }}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  warmupEnabled ? `bg-gradient-to-r ${accentFrom} ${accentTo}` : "bg-zinc-700"
                }`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300 ${
                  warmupEnabled ? "left-6" : "left-0.5"
                }`} />
              </button>
            </div>
          </div>

          {/* Warm-up Set (conditional) */}
          {warmupEnabled && (
            <div className="px-5 py-4 border-b border-zinc-800/40 flex items-center justify-between animate-fade-in">
              <div>
                <p className="text-sm font-semibold text-zinc-400">Set de Calentamiento</p>
                <p className="text-[11px] text-zinc-600 font-mono mt-0.5">Preparación articular · ~50% del peso</p>
              </div>
              <NumericStepper
                value={warmupWeight}
                onChange={async (v) => { setWarmupWeight(v); await save({ set1Weight: v }); }}
                placeholder={unit === "kg" ? "kg" : "lbs"}
                step={unit === "kg" ? 2.5 : 5}
              />
            </div>
          )}

          {/* Set 1: Aproximación */}
          <div className="px-5 py-4 border-b border-zinc-800/40">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-300">Set 1 · Aproximación</p>
                <p className="text-[11px] text-zinc-600 font-mono mt-0.5">Carga moderada · RPE 7</p>
              </div>
              <div className="flex items-center gap-2">
                <NumericStepper
                  value={set1Weight}
                  onChange={async (v) => { setSet1Weight(v); await save({ set1Weight: v }); }}
                  placeholder={unit}
                  step={unit === "kg" ? 2.5 : 5}
                />
                <span className="text-[10px] text-zinc-600 font-mono w-6 text-right">{unit}</span>
              </div>
            </div>
          </div>

          {/* Set 2: TOP SET */}
          <div className={`px-5 py-4 border-b border-zinc-800/40 ${accentBg} border-l-2 ${accentBorder}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className={`text-sm font-black ${accentText} flex items-center gap-1.5`}>
                  Set 2 · TOP SET <Sparkles size={13} className={`${accentText} animate-pulse`} />
                </p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Esfuerzo máximo · RPE 9-10 al fallo</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Peso ({unit})</p>
                <NumericStepper
                  value={topSetWeight}
                  onChange={async (v) => { setTopSetWeight(v); await save({ topSetWeight: v }); }}
                  placeholder={unit}
                  step={unit === "kg" ? 2.5 : 5}
                  highlight
                />
              </div>
              <div className="text-zinc-700 font-black text-xl">×</div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Reps</p>
                <RepStepper
                  value={topSetReps}
                  onChange={async (v) => { setTopSetReps(v); await save({ topSetReps: v }); }}
                  highlight
                />
              </div>
            </div>

            {/* Rep range feedback */}
            {repFeedback && (
              <div className={`mt-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center gap-2 animate-fade-in`}>
                <span className="text-base">{repFeedback.icon}</span>
                <p className={`text-xs font-semibold ${repFeedback.color}`}>{repFeedback.message}</p>
              </div>
            )}
          </div>

          {/* Sets 3 & 4: Back-off */}
          <div className="px-5 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-zinc-300">Sets 3 & 4 · Back-off</p>
                <p className="text-[11px] text-zinc-600 font-mono mt-0.5">Fatiga acumulada · -10% del peso</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono w-8 text-right">S3</span>
                  <NumericStepper
                    value={set3Weight}
                    onChange={async (v) => { setSet3Weight(v); await save({ set3Weight: v }); }}
                    placeholder={unit}
                    step={unit === "kg" ? 2.5 : 5}
                  />
                  <span className="text-[10px] text-zinc-600 font-mono">{unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600 font-mono w-8 text-right">S4</span>
                  <NumericStepper
                    value={set4Weight}
                    onChange={async (v) => { setSet4Weight(v); await save({ set4Weight: v }); }}
                    placeholder={unit}
                    step={unit === "kg" ? 2.5 : 5}
                  />
                  <span className="text-[10px] text-zinc-600 font-mono">{unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Rest Timer ───────────────────────────────────────────────────────── */}
        <div className="mx-4 mt-4 mb-6 rounded-3xl border border-zinc-800/60 bg-zinc-900/40 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-black tracking-widest text-zinc-300 uppercase">⏱ Descanso</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {timerMode === "normal" ? "Modo Normal · 3:00" : "Modo Rápido · 2:00"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {timerActive && (
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-200 active:scale-90 transition-all"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Timer ring + display */}
          <div className="flex items-center gap-5">
            {/* SVG ring */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Track */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#27272a" strokeWidth="6" />
                {/* Progress */}
                <circle
                  cx="50" cy="50" r="38"
                  fill="none"
                  stroke={timerDone ? "#10b981" : isElla ? "#ec4899" : "#f59e0b"}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={timerActive ? strokeDashoffset : timerDone ? 0 : circumference}
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                {timerDone ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-lg font-black text-zinc-100 font-mono">
                    {timerActive ? formatTime(timerSeconds) : formatTime(totalSeconds)}
                  </span>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex-1">
              {timerDone ? (
                <p className="text-sm font-bold text-emerald-400 mb-3">¡Descansaste bien! 💪</p>
              ) : (
                <p className="text-sm text-zinc-400 mb-3">
                  {timerActive ? "Descansando..." : "Presiona Start después de completar cada serie."}
                </p>
              )}
              <button
                id="timer-start-btn"
                onClick={timerActive ? resetTimer : startTimer}
                className={`w-full py-3 rounded-2xl font-black text-sm tracking-wide transition-all active:scale-[0.97] flex items-center justify-center gap-2 ${
                  timerActive
                    ? "bg-zinc-800 text-zinc-300 border border-zinc-700"
                    : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white shadow-lg`
                }`}
              >
                {timerActive ? (
                  <><RotateCcw size={15} /> Cancelar</>
                ) : (
                  <><Zap size={15} /> {timerDone ? "Nuevo descanso" : "Start Timer"}</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        {exercise.notes && (
          <div className="mx-4 mb-8 p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/40">
            <p className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest mb-1.5">📝 Técnica</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{exercise.notes}</p>
          </div>
        )}

        {/* Dropset note */}
        {exercise.isDropset && (
          <div className="mx-4 mb-8 p-4 rounded-2xl bg-red-950/20 border border-red-900/40">
            <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest mb-1.5">💥 DROPSET INSTRUCTIONS</p>
            <p className="text-sm text-red-300/80 leading-relaxed">
              Top Set pesado → Drop inmediato (sin descanso):<br />
              4 reps → 6 reps → 8 reps → 10 reps<br />
              Baja el peso ~20% en cada drop.
            </p>
          </div>
        )}

        {/* Bottom spacer */}
        <div className="h-28" />
      </div>

      {/* ─── Complete Exercise Button (Fixed Bottom) ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent safe-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            id="complete-exercise-fixed-btn"
            onClick={handleComplete}
            className={`w-full py-4 rounded-2xl font-black text-base tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-2xl ${
              isCompleted
                ? "bg-emerald-500 text-white shadow-emerald-950/50"
                : `bg-gradient-to-r ${accentFrom} ${accentTo} text-white shadow-black/50`
            }`}
          >
            {isCompleted ? (
              <><Check size={18} strokeWidth={3} /> Ejercicio Completado ✓</>
            ) : (
              <><Check size={18} strokeWidth={3} /> Marcar como Completado</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
