import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Trophy, Flame, Target, Plus, Minus, Save, Trash2, X } from "lucide-react";
import type { ProfileId } from "@/data/routines";
import { getRoutineForProfile } from "@/data/routines";
import { getSessions, getSessionByDate, updateSessionExercises, deleteSession, getTotalSessions, getCurrentStreak, getTopMuscle } from "@/db/profileStore";
import type { ExerciseLog } from "@/db/profileStore";

interface AnalyticsViewProps {
  profile: ProfileId;
  theme: "light" | "dark";
}

const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AnalyticsView({ profile, theme }: AnalyticsViewProps) {
  const isDark = theme === "dark";
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const sessions = useMemo(() => getSessions(profile), [profile]);
  const sessionDates = useMemo(() => new Set(sessions.map((s) => s.date)), [sessions]);
  const totalSessions = getTotalSessions(profile);
  const currentStreak = getCurrentStreak(profile);
  const topMuscle = getTopMuscle(profile);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toLocaleDateString("en-CA");

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedSession = selectedDate ? getSessionByDate(profile, selectedDate) : null;

  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-600" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-5 overflow-y-auto">

        {/* Quick Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sesiones", value: totalSessions, icon: Trophy },
            { label: "Racha", value: `${currentStreak} días`, icon: Flame },
            { label: "Top Músculo", value: topMuscle, icon: Target },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`border rounded-xl p-3 ${cardBg}`}>
              <Icon size={14} className="text-pink-500 mb-1" />
              <p className={`text-[10px] font-mono uppercase tracking-wider ${textMuted}`}>{label}</p>
              <p className={`text-sm font-black leading-tight mt-0.5 ${textPrimary}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Calendar Header */}
        <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <button onClick={prevMonth} className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
            }`}>
              <ChevronLeft size={18} />
            </button>
            <h3 className={`font-black text-sm ${textPrimary}`}>
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} className={`p-1.5 rounded-lg transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-zinc-100 text-zinc-500"
            }`}>
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 px-4 pt-3 pb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className={`text-center text-[10px] font-mono font-bold uppercase tracking-wider ${textMuted}`}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 px-4 pb-4">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const hasSession = sessionDates.has(dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(hasSession ? dateStr : null)}
                  className={`relative flex items-center justify-center w-full aspect-square rounded-xl text-sm font-semibold transition-all active:scale-90 ${
                    isSelected
                      ? "bg-pink-500 text-white shadow-md"
                      : hasSession
                        ? isDark
                          ? "text-emerald-400 hover:bg-zinc-800"
                          : "text-emerald-600 hover:bg-zinc-100"
                        : isDark
                          ? "text-zinc-600 hover:text-zinc-400"
                          : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {day}
                  {hasSession && (
                    <div className={`absolute -top-0.5 right-1 w-1.5 h-1.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-emerald-500"
                    }`} />
                  )}
                  {isToday && !isSelected && (
                    <div className={`absolute inset-1 rounded-lg border-2 ${
                      isDark ? "border-zinc-600" : "border-zinc-300"
                    }`} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Detail / Post-Edit */}
        {selectedSession && (
          <SessionDetail
            session={selectedSession}
            profile={profile}
            theme={theme}
            onUpdated={() => setSelectedDate(selectedDate)}
          />
        )}

        {!selectedSession && sessions.length > 0 && (
          <p className={`text-center text-xs font-mono ${textMuted}`}>
            Toca un día resaltado para ver el detalle del entrenamiento
          </p>
        )}

        {sessions.length === 0 && (
          <div className={`text-center py-12 ${textMuted}`}>
            <p className="text-3xl mb-3">📝</p>
            <p className="text-sm font-mono">Completa tu primer entrenamiento para ver tu historial aquí.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionDetail({
  session, profile, theme, onUpdated,
}: {
  session: NonNullable<ReturnType<typeof getSessionByDate>>;
  profile: ProfileId;
  theme: "light" | "dark";
  onUpdated: () => void;
}) {
  const isDark = theme === "dark";
  const [editing, setEditing] = useState(false);
  const [exercises, setExercises] = useState(() =>
    session.exercises.map((e) => ({ ...e }))
  );

  const routine = getRoutineForProfile(profile);
  const routineDay = routine.find((d) => d.id === session.dayId);
  const availableExercises = routineDay
    ? routineDay.exercises.filter(
        (re) => !exercises.some((e) => e.exerciseName === re.name)
      )
    : [];

  const cardBg = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";

  const updateExercise = (idx: number, field: keyof ExerciseLog, value: string | boolean) => {
    setExercises((prev) => {
      const next = prev.map((e) => ({ ...e })) as ExerciseLog[];
      (next[idx] as unknown as Record<string, unknown>)[field] = value;
      return next;
    });
  };

  const handleSave = () => {
    updateSessionExercises(profile, session.date, exercises);
    setEditing(false);
    onUpdated();
  };

  const handleDeleteExercise = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleDeleteDay = () => {
    deleteSession(profile, session.date);
    onUpdated();
  };

  const handleAddExercise = (name: string) => {
    const newLog: ExerciseLog = {
      exerciseName: name,
      topSetWeight: "",
      topSetReps: "",
      bo1Weight: "",
      bo1Reps: "",
      bo2Weight: "",
      bo2Reps: "",
      bo3Weight: "",
      bo3Reps: "",
      bo3Enabled: false,
      warmupEnabled: false,
      warmupWeight: "",
      isCompleted: false,
      unit: session.exercises[0]?.unit || "kg",
    };
    setExercises((prev) => [...prev, newLog]);
  };

  const dateFormatted = new Date(session.date + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className={`border rounded-2xl overflow-hidden ${cardBg}`}>
      <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-black ${textPrimary}`}>{session.dayTitle}</h3>
          <p className={`text-[10px] font-mono ${textMuted}`}>{dateFormatted}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {editing && (
            <button
              onClick={handleDeleteDay}
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                isDark
                  ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-pink-500 text-white border border-pink-400"
            >
              <Save size={12} />
              Guardar
            </button>
          )}
        </div>
      </div>
      <div className="p-4 space-y-2">
        {exercises.map((ex, idx) => (
          <div key={idx} className={`border rounded-xl p-3 relative ${isDark ? "border-zinc-800" : "border-zinc-100"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-xs font-bold ${textPrimary}`}>{ex.exerciseName}</p>
              {editing && (
                <button
                  onClick={() => handleDeleteExercise(idx)}
                  className="p-1 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              <SetRow label="Top Set" weight={ex.topSetWeight} reps={ex.topSetReps} unit={ex.unit}
                editing={editing}
                onWeightChange={(v) => updateExercise(idx, "topSetWeight", v)}
                onRepsChange={(v) => updateExercise(idx, "topSetReps", v)}
                isDark={isDark}
              />
              <SetRow label="Back-off 1" weight={ex.bo1Weight} reps={ex.bo1Reps} unit={ex.unit}
                editing={editing}
                onWeightChange={(v) => updateExercise(idx, "bo1Weight", v)}
                onRepsChange={(v) => updateExercise(idx, "bo1Reps", v)}
                isDark={isDark}
              />
              <SetRow label="Back-off 2" weight={ex.bo2Weight} reps={ex.bo2Reps} unit={ex.unit}
                editing={editing}
                onWeightChange={(v) => updateExercise(idx, "bo2Weight", v)}
                onRepsChange={(v) => updateExercise(idx, "bo2Reps", v)}
                isDark={isDark}
              />
              {ex.bo3Enabled && (
                <SetRow label="Back-off 3" weight={ex.bo3Weight} reps={ex.bo3Reps} unit={ex.unit}
                  editing={editing}
                  onWeightChange={(v) => updateExercise(idx, "bo3Weight", v)}
                  onRepsChange={(v) => updateExercise(idx, "bo3Reps", v)}
                  isDark={isDark}
                />
              )}
            </div>
          </div>
        ))}

        {/* Add Exercise */}
        {editing && availableExercises.length > 0 && (
          <div className="pt-2">
            <AddExerciseDropdown
              exercises={availableExercises.map((e) => e.name)}
              onSelect={handleAddExercise}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function AddExerciseDropdown({
  exercises, onSelect, isDark,
}: {
  exercises: string[];
  onSelect: (name: string) => void;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-colors w-full ${
          isDark
            ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
        }`}
      >
        <Plus size={12} />
        Añadir Ejercicio
      </button>
      {open && (
        <div className={`absolute bottom-full mb-1 left-0 right-0 z-10 rounded-xl border shadow-lg max-h-48 overflow-y-auto ${
          isDark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200"
        }`}>
          {exercises.map((name) => (
            <button
              key={name}
              onClick={() => { onSelect(name); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-xs font-semibold transition-colors hover:bg-pink-500/10 ${
                isDark ? "text-zinc-300 hover:text-white" : "text-zinc-700 hover:text-zinc-900"
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SetRow({
  label, weight, reps, unit, editing, onWeightChange, onRepsChange, isDark,
}: {
  label: string;
  weight: string;
  reps: string;
  unit: string;
  editing: boolean;
  onWeightChange: (v: string) => void;
  onRepsChange?: (v: string) => void;
  isDark: boolean;
}) {
  const numWeight = parseFloat(weight) || 0;
  const numReps = parseInt(reps) || 0;

  const textMuted = isDark ? "text-zinc-500" : "text-zinc-400";

  return (
    <div className="flex items-center justify-between">
      <span className={`text-[10px] font-mono ${textMuted}`}>{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => onWeightChange(String(Math.max(0, numWeight - 2.5)))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors active:scale-90 ${
                isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Minus size={10} />
            </button>
            <span className={`text-xs font-bold font-mono w-12 text-center ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
              {weight || "—"} {unit}
            </span>
            <button onClick={() => onWeightChange(String(numWeight + 2.5))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors active:scale-90 ${
                isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Plus size={10} />
            </button>
          </div>
          {onRepsChange && (
            <div className="flex items-center gap-1">
              <button onClick={() => onRepsChange(String(Math.max(0, numReps - 1)))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors active:scale-90 ${
                  isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Minus size={10} />
              </button>
              <span className={`text-xs font-bold font-mono w-8 text-center ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                {reps || "—"}
              </span>
              <button onClick={() => onRepsChange(String(numReps + 1))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-colors active:scale-90 ${
                  isDark ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800" : "border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Plus size={10} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <span className={`text-xs font-bold font-mono ${isDark ? "text-zinc-200" : "text-zinc-700"}`}>
          {weight || "—"} {unit}
          {reps ? ` × ${reps} reps` : ""}
        </span>
      )}
    </div>
  );
}
