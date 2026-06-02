import ExerciseCard from "@/components/ExerciseCard";
import { LogOut, BarChart2, Shield, Calendar, History, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { olympusDb } from "@/db/olympusDb";
import type { WorkoutLog } from "@/db/olympusDb";

interface DashboardProps {
  profile: "haniel" | "novia";
  onLogout: () => void;
}

interface ExerciseConfig {
  name: string;
  restTime: number;
  isSuperset?: boolean;
  isDropset?: boolean;
}

interface RoutineDay {
  day: string;
  exercises: ExerciseConfig[];
}

export default function Dashboard({ profile, onLogout }: DashboardProps) {
  const isHaniel = profile === "haniel";
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [historyLogs, setHistoryLogs] = useState<WorkoutLog[]>([]);
  const [unit, setUnit] = useState<"kg" | "lbs">(
    (localStorage.getItem("olympus_weight_unit") as "kg" | "lbs") || "kg"
  );

  const toggleUnit = () => {
    const nextUnit = unit === "kg" ? "lbs" : "kg";
    setUnit(nextUnit);
    localStorage.setItem("olympus_weight_unit", nextUnit);
  };

  // Define routines
  const hanielRoutine: RoutineDay[] = [
    {
      day: "🦵 DÍA 1) Legs | Glutes & Hamstrings",
      exercises: [
        { name: "Barbell Hip Thrust", restTime: 2 },
        { name: "Barbell RDL (Rumano)", restTime: 2 },
        { name: "Deficit Reverse Lunge", restTime: 2 },
        { name: "Glute Medius Kickback", restTime: 2 },
      ],
    },
    {
      day: "🎯 DÍA 2) Push | Shoulders, Chest, Triceps",
      exercises: [
        { name: "Barbell Strict Press", restTime: 2 },
        { name: "Cable Rope Tricep Pushdown", restTime: 2, isSuperset: true },
        { name: "Cable Diamond Front Raise", restTime: 2, isSuperset: true },
        { name: "Low Cable Chest Fly / Seated Press", restTime: 2 },
        { name: "Half Kneeling Single Arm Press", restTime: 2 },
        { name: "Overhead DB Tricep Extension", restTime: 2 },
      ],
    },
    {
      day: "🦵 DÍA 3) Legs | Quads & Calves",
      exercises: [
        { name: "Barbell Back Squat", restTime: 2 },
        { name: "Narrow and Low Stance Leg Press", restTime: 2 },
        { name: "Alternating Steps", restTime: 2 },
        { name: "DB Squat o Leg Extension", restTime: 2, isSuperset: true },
        { name: "DB Calf Raise", restTime: 2, isSuperset: true },
      ],
    },
    {
      day: "📐 DÍA 4) Pull | Back & Biceps",
      exercises: [
        { name: "Dead Stop Row (Barbell Bent Over)", restTime: 2 },
        { name: "Bent Over Reverse Fly", restTime: 2, isSuperset: true },
        { name: "Hammer to Wide Bicep Curl", restTime: 2, isSuperset: true },
        { name: "Lat Pulldown Dropset (8-12 reps al fallo ➔ 4,6,8,10)", restTime: 2, isDropset: true },
        { name: "Cable Rope Bicep Curl", restTime: 2 },
        { name: "Single Arm Bent Over Row", restTime: 2 },
      ],
    },
  ];

  const hermosaRoutine: RoutineDay[] = [
    {
      day: "🦵 DÍA 1) Legs | Glutes & Hamstrings Focus",
      exercises: [
        { name: "Barbell Hip Thrust", restTime: 2 },
        { name: "Barbell RDL (Rumano)", restTime: 2 },
        { name: "Deficit Reverse Lunge", restTime: 2 },
        { name: "Glute Medius Kickback", restTime: 2 },
      ],
    },
    {
      day: "🌸 DÍA 2) Upper Body | Tone & Strength",
      exercises: [
        { name: "Dumbbell Shoulder Press", restTime: 2 },
        { name: "Cable Face Pull", restTime: 2 },
        { name: "Incline Dumbbell Chest Press", restTime: 2 },
        { name: "Tricep Overhead Extension", restTime: 2 },
        { name: "Dumbbell Hammer Curl", restTime: 2 },
      ],
    },
    {
      day: "🦵 DÍA 3) Legs | Quads & Calves Accent",
      exercises: [
        { name: "Goblet Squat (Heavy)", restTime: 2 },
        { name: "Leg Press (Low Foot Placement)", restTime: 2 },
        { name: "Walking Lunges", restTime: 2 },
        { name: "Leg Extension", restTime: 2 },
        { name: "Calf Raises (Smith Machine)", restTime: 2 },
      ],
    },
    {
      day: "📐 DÍA 4) Pull | Back Shaping & Core",
      exercises: [
        { name: "Lat Pulldown (Wide Grip)", restTime: 2 },
        { name: "Seated Cable Row", restTime: 2 },
        { name: "Bent Over Reverse Fly", restTime: 2 },
        { name: "Hanging Knee Raises", restTime: 2 },
        { name: "Plank Hold", restTime: 2 },
      ],
    },
  ];

  const currentRoutine = isHaniel ? hanielRoutine : hermosaRoutine;
  const allExerciseNames = currentRoutine.flatMap((r) => r.exercises.map((e) => e.name));

  // Fetch stats and history
  const loadDatabaseStates = async () => {
    try {
      let completed = 0;
      let total = 0;

      // Scan and calculate active inputs
      for (const day of currentRoutine) {
        for (const ex of day.exercises) {
          total++;
          const record = await olympusDb.getSetInputs(profile, ex.name);
          if (record && record.isCompleted) {
            completed++;
          }
        }
      }

      setCompletedCount(completed);
      setTotalCount(total);

      // Fetch history logs
      const logs = await olympusDb.getLogsByProfile(profile);
      setHistoryLogs(logs);
    } catch (e) {
      console.error("Error loading offline database states", e);
    }
  };

  useEffect(() => {
    loadDatabaseStates();

    // Listen to updates from ExerciseCard completed triggers
    const handleUpdate = () => {
      loadDatabaseStates();
    };

    window.addEventListener("olympus_db_update", handleUpdate);
    return () => {
      window.removeEventListener("olympus_db_update", handleUpdate);
    };
  }, [profile, currentRoutine]);

  // Reset database values
  const resetAll = async () => {
    if (confirm("¿Estás seguro de reiniciar todas las marcas e historial de este perfil?")) {
      await olympusDb.clearProfileData(profile, allExerciseNames);
      loadDatabaseStates();
    }
  };

  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/20">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Shield className={`w-5 h-5 ${isHaniel ? "text-amber-500" : "text-pink-500"}`} />
            <span className="font-black tracking-widest text-sm font-mono">OLYMPUS v4.0</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleUnit}
              title="Cambiar Unidad (KG / LBS)"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 text-xs font-mono font-bold text-zinc-400 hover:text-zinc-200 transition-colors uppercase"
            >
              ⚖️ {unit}
            </button>
            <button
              onClick={resetAll}
              title="Reiniciar base de datos de este perfil"
              className="p-2 rounded-lg bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-900/30 transition-colors"
            >
              <Trash2 size={14} />
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-850 hover:border-red-900/30 text-xs font-mono text-zinc-400 hover:text-red-400 transition-all duration-200 flex items-center space-x-1.5"
            >
              <LogOut size={12} />
              <span>SALIR</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-20">
        {/* Profile Card / Header */}
        <header className="border border-zinc-900 bg-zinc-900/10 p-5 rounded-2xl relative overflow-hidden backdrop-blur-sm shadow-xl">
          <div
            className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-3xl opacity-10 pointer-events-none -mr-8 -mt-8 ${
              isHaniel ? "bg-amber-500" : "bg-pink-500"
            }`}
          />
          <div>
            <span
              className={`text-xs uppercase tracking-widest font-mono font-bold px-2.5 py-0.5 rounded ${
                isHaniel
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-pink-500/10 text-pink-400 border border-pink-500/20"
              }`}
            >
              ATLETA: {isHaniel ? "HANIEL" : "HERMOSA"}
            </span>
            <h1 className="text-3xl font-black tracking-tighter mt-2 text-zinc-100 uppercase">
              {isHaniel ? "ATHLETE DASHBOARD" : "HERMOSA DASHBOARD"}
            </h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono">
              HYPERMECHANICS PRO // 100% OFFLINE DB CONFIG
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-900/80 grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-lg bg-zinc-900/80 ${isHaniel ? "text-amber-500" : "text-pink-500"}`}>
                <BarChart2 size={16} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Progreso Diario</p>
                <p className="text-sm font-bold text-zinc-200 font-mono">
                  {completedCount}/{totalCount} ({progressPercentage}%)
                </p>
              </div>
            </div>
          </div>

          {/* Progress Visual Bar */}
          <div className="w-full bg-zinc-905 h-2 rounded-full mt-4 overflow-hidden border border-zinc-900">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isHaniel ? "bg-amber-500" : "bg-pink-500"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </header>

        {/* Days & Exercises */}
        {currentRoutine.map((block, blockIdx) => (
          <section key={blockIdx} className="space-y-3">
            <h2 className="text-xs font-bold tracking-widest text-zinc-400 uppercase bg-zinc-900/80 border border-zinc-900 px-3 py-2 rounded-xl flex items-center justify-between">
              <span>{block.day}</span>
            </h2>

            <div className="space-y-1">
              {block.exercises.map((ex, exIdx) => {
                return (
                  <div key={exIdx}>
                    {ex.isSuperset && (exIdx === 0 || !block.exercises[exIdx - 1]?.isSuperset) && (
                      <p className="text-[10px] text-amber-500 font-mono mb-1.5 px-2 tracking-widest uppercase flex items-center gap-1 mt-3">
                        ⛓️ SUPERSET / BISERIE
                      </p>
                    )}
                    {ex.isDropset && (
                      <p className="text-[10px] text-red-500 font-mono mb-1.5 px-2 tracking-widest uppercase flex items-center gap-1 mt-3">
                        💥 DROPSET SPECIAL
                      </p>
                    )}
                    <ExerciseCard
                      name={ex.name}
                      restTime={ex.restTime}
                      profile={profile}
                      unit={unit}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Historial de Entrenamiento (Database Query View) */}
        <section className="space-y-3 border-t border-zinc-900 pt-8">
          <h2 className="text-sm font-bold tracking-wider text-zinc-350 flex items-center gap-2">
            <History size={16} className={isHaniel ? "text-amber-500" : "text-pink-500"} />
            <span>📊 HISTORIAL DE SOBRECARGA (OFFLINE DB)</span>
          </h2>
          
          {historyLogs.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-xl p-6 text-center text-zinc-500 text-xs font-mono">
              Presiona el check de completar en los ejercicios para registrar logs en la base de datos.
            </div>
          ) : (
            <div className="border border-zinc-900 bg-zinc-900/10 rounded-xl overflow-hidden shadow-md max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-zinc-900/60 text-zinc-400 border-b border-zinc-900">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Ejercicio</th>
                    <th className="p-3 text-center">Top Set</th>
                    <th className="p-3 text-center">Back-Offs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {historyLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-zinc-900/20 text-zinc-300">
                      <td className="p-3 flex items-center gap-1 text-[11px] text-zinc-500">
                        <Calendar size={11} />
                        {log.date}
                      </td>
                      <td className="p-3 font-semibold text-zinc-200">{log.exerciseName}</td>
                      <td className="p-3 text-center font-bold text-amber-400">
                        {log.topSetKg || "-"} {unit} x {log.topSetReps || "-"}
                      </td>
                      <td className="p-3 text-center text-zinc-400">
                        {log.set3Kg ? `${log.set3Kg} ${unit}` : "-"} / {log.set4Kg ? `${log.set4Kg} ${unit}` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
