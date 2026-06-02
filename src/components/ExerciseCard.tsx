import { useState, useEffect } from "react";
import { CardSplitAccordian } from "@/components/ui/card-split-accordian";
import { RotateCcw, Check, Sparkles, Zap } from "lucide-react";
import { olympusDb } from "@/db/olympusDb";

interface ExerciseProps {
  name: string;
  restTime: number;
  profile: "haniel" | "novia";
  unit: "kg" | "lbs";
}

export default function ExerciseCard({ name, restTime, profile, unit }: ExerciseProps) {
  const [set1Kg, setSet1Kg] = useState<string>("");
  const [topSetKg, setTopSetKg] = useState<string>("");
  const [topSetReps, setTopSetReps] = useState<string>("");
  const [set3Kg, setSet3Kg] = useState<string>("");
  const [set4Kg, setSet4Kg] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const totalTimerSeconds = restTime * 60;

  // Progressive Overload Feedback
  const [feedback, setFeedback] = useState<string>("");

  // Load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const record = await olympusDb.getSetInputs(profile, name);
        if (record) {
          setSet1Kg(record.set1Kg || "");
          setTopSetKg(record.topSetKg || "");
          setTopSetReps(record.topSetReps || "");
          setSet3Kg(record.set3Kg || "");
          setSet4Kg(record.set4Kg || "");
          setIsCompleted(record.isCompleted || false);
          if (record.topSetReps) {
            evaluarProgreso(Number(record.topSetReps));
          } else {
            setFeedback("");
          }
        } else {
          setSet1Kg("");
          setTopSetKg("");
          setTopSetReps("");
          setSet3Kg("");
          setSet4Kg("");
          setIsCompleted(false);
          setFeedback("");
        }
      } catch (err) {
        console.error("Error reading IndexedDB", err);
      }
    }
    loadData();
  }, [profile, name]);

  const saveData = async (updates: Record<string, any>) => {
    try {
      const current = {
        set1Kg,
        topSetKg,
        topSetReps,
        set3Kg,
        set4Kg,
        isCompleted,
        ...updates,
      };
      const key = `${profile}_${name.replace(/\s+/g, "_").toLowerCase()}`;
      await olympusDb.saveSetInputs({
        key,
        profile,
        exerciseName: name,
        ...current,
      });
    } catch (err) {
      console.error("Failed to save to database", err);
    }
  };

  // Rest Timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (timerActive) {
      setTimerActive(false);
    } else {
      setTimerSeconds(totalTimerSeconds);
      setTimerActive(true);
    }
  };

  const resetTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const evaluarProgreso = (reps: number) => {
    if (reps > 12) {
      setFeedback("⚡ Peso muy ligero. ¡Sube el peso de inmediato!");
    } else if (reps === 12) {
      setFeedback("🔥 ¡Dominado al fallo! Próxima sesión toca Sobrecarga Progresiva (+peso).");
    } else if (reps >= 8 && reps < 12) {
      setFeedback("🎯 Rango óptimo. Mantén el peso hasta alcanzar las 12 reps.");
    } else if (reps > 0 && reps < 8) {
      setFeedback("💡 Peso demasiado alto. Baja la carga para asegurar el rango funcional.");
    } else {
      setFeedback("");
    }
  };

  const handleTopSetRepsChange = async (val: string) => {
    setTopSetReps(val);
    const numReps = Number(val);
    evaluarProgreso(numReps);
    await saveData({ topSetReps: val });
  };

  const toggleCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    await saveData({ isCompleted: newCompleted });

    if (newCompleted) {
      // Log to historical database database
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
      await olympusDb.addWorkoutLog({
        date: today,
        timestamp: Date.now(),
        profile,
        exerciseName: name,
        set1Kg,
        topSetKg,
        topSetReps,
        set3Kg,
        set4Kg,
      });

      // Dispatch event to force Dashboard to reload history
      window.dispatchEvent(new Event("olympus_db_update"));
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // Circular timer constants
  const strokeDashoffset = timerActive
    ? 50.26 - (timerSeconds / totalTimerSeconds) * 50.26
    : 0;

  return (
    <div
      className={`border transition-all duration-300 rounded-xl my-3 overflow-hidden ${
        isCompleted
          ? "border-emerald-800/40 bg-emerald-950/5 shadow-md shadow-emerald-950/20"
          : "border-zinc-800/60 bg-zinc-900/10 hover:border-zinc-700/60 hover:shadow-lg hover:shadow-zinc-950/30"
      }`}
    >
      <CardSplitAccordian>
        {/* Header content */}
        <div className="p-4 flex justify-between items-center bg-zinc-900/40">
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleCompleted}
              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-200 ${
                isCompleted
                  ? "bg-emerald-500 border-emerald-400 text-zinc-950"
                  : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/60"
              }`}
            >
              {isCompleted && <Check size={14} className="stroke-[3]" />}
            </button>
            <h4
              className={`font-semibold tracking-wide text-base transition-all duration-200 ${
                isCompleted ? "text-zinc-500 line-through decoration-zinc-750" : "text-zinc-100"
              }`}
            >
              {name}
            </h4>
          </div>

          <div className="flex items-center space-x-3">
            {/* Countdown timer button with progress circle */}
            <button
              onClick={startTimer}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs font-mono transition-all duration-300 relative overflow-hidden border ${
                timerActive
                  ? "bg-amber-500 border-amber-400 text-zinc-950 font-bold"
                  : "bg-zinc-850 border-zinc-800 hover:bg-zinc-800 text-zinc-400"
              }`}
            >
              <svg className="w-4 h-4 transform -rotate-95" viewBox="0 0 20 20">
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  className={timerActive ? "stroke-amber-800" : "stroke-zinc-800"}
                  strokeWidth="2.5"
                  fill="transparent"
                />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  className={timerActive ? "stroke-zinc-950" : "stroke-amber-500"}
                  strokeWidth="2.5"
                  fill="transparent"
                  strokeDasharray="50.26"
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <span>{timerActive ? formatTime(timerSeconds) : `${restTime} min`}</span>
              {timerActive && (
                <RotateCcw
                  size={12}
                  className="hover:scale-125 transition-transform"
                  onClick={resetTimer}
                />
              )}
            </button>
          </div>
        </div>

        {/* Accordion Split Zone */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-900/80 space-y-4">
          
          {/* SET 1: Aproximación */}
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
            <div>
              <p className="text-sm font-medium text-zinc-300">Set 1: Aproximación</p>
              <p className="text-xs text-zinc-500">Calentamiento y preparación articular</p>
            </div>
            <input
              type="text"
              placeholder={unit === "kg" ? "Kg" : "Lbs"}
              value={set1Kg}
              onChange={async (e) => {
                setSet1Kg(e.target.value);
                await saveData({ set1Kg: e.target.value });
              }}
              className="w-20 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-lg px-2 py-1 text-center text-sm font-mono text-zinc-200 outline-none transition-colors"
            />
          </div>

          {/* SET 2: Top Set (Módulo Inteligente) */}
          <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 bg-zinc-900/25 p-2 rounded-lg border border-zinc-800/40 shadow-inner">
            <div>
              <p className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                Set 2: TOP SET (Pesado) <Sparkles size={13} className="text-amber-500 animate-pulse" />
              </p>
              <p className="text-xs text-zinc-400">Esfuerzo máximo (RPE 9-10) al fallo</p>
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder={unit === "kg" ? "Kg" : "Lbs"}
                value={topSetKg}
                onChange={async (e) => {
                  setTopSetKg(e.target.value);
                  await saveData({ topSetKg: e.target.value });
                }}
                className="w-16 bg-zinc-900 border border-zinc-800 focus:border-amber-500/50 rounded px-2 py-1 text-center text-sm font-mono font-bold text-zinc-150 outline-none transition-colors"
              />
              <input
                type="number"
                placeholder="Reps"
                value={topSetReps}
                onChange={(e) => handleTopSetRepsChange(e.target.value)}
                className="w-16 bg-zinc-900 border border-zinc-850 focus:border-amber-500 rounded px-2 py-1 text-center text-sm font-mono font-bold text-amber-400 outline-none transition-colors"
              />
            </div>
          </div>

          {/* SETS 3 & 4: Back-off Sets */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <p className="text-sm font-medium text-zinc-300">Sets 3 y 4: Back-off</p>
              <p className="text-xs text-zinc-500">Fatiga acumulada (-10% peso)</p>
            </div>
            <div className="space-y-1.5">
              <input
                type="text"
                placeholder={unit === "kg" ? "Set 3 Kg" : "Set 3 Lbs"}
                value={set3Kg}
                onChange={async (e) => {
                  setSet3Kg(e.target.value);
                  await saveData({ set3Kg: e.target.value });
                }}
                className="w-24 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded px-2 py-1 text-center text-xs font-mono text-zinc-300 outline-none transition-colors block"
              />
              <input
                type="text"
                placeholder={unit === "kg" ? "Set 4 Kg" : "Set 4 Lbs"}
                value={set4Kg}
                onChange={async (e) => {
                  setSet4Kg(e.target.value);
                  await saveData({ set4Kg: e.target.value });
                }}
                className="w-24 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded px-2 py-1 text-center text-xs font-mono text-zinc-300 outline-none transition-colors block"
              />
            </div>
          </div>

          {/* Feedback en tiempo real usando micro-animaciones */}
          {feedback && (
            <div className="mt-3 p-3 rounded-lg bg-zinc-900/60 border border-amber-500/10 text-xs font-mono text-center text-zinc-300 flex items-center justify-center gap-1.5 animate-fade-in">
              <Zap size={12} className="text-amber-500" />
              <span>{feedback}</span>
            </div>
          )}
        </div>
      </CardSplitAccordian>
    </div>
  );
}
