import { Flame, Trophy } from "lucide-react";
import { getRoutineForProfile } from "@/data/routines";
import type { ProfileId } from "@/data/routines";
import { getTotalSessions, getCurrentStreak } from "@/db/profileStore";

interface HomeViewProps {
  profile: ProfileId;
  theme: "light" | "dark";
}

export default function HomeView({ profile, theme }: HomeViewProps) {
  const isDark = theme === "dark";
  const isElla = profile === "ella";
  const routine = getRoutineForProfile(profile);
  const profileName = isElla ? "HERMOSA" : "HANIEL";
  const totalSessions = getTotalSessions(profile);
  const currentStreak = getCurrentStreak(profile);
  const nextDay = routine[0];

  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-zinc-500";
  const textMuted = isDark ? "text-zinc-600" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Buenos días" : today.getHours() < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className={`min-h-full ${bg} ${textPrimary} flex flex-col`}>
      <div className="flex-1 max-w-2xl mx-auto w-full px-4 pt-6 pb-28 space-y-5 overflow-y-auto">

        {/* Greeting */}
        <div>
          <p className={`text-xs font-mono uppercase tracking-widest ${textMuted}`}>
            {greeting}
          </p>
          <h1 className={`text-3xl font-black tracking-tighter ${textPrimary}`}>
            {profileName}
          </h1>
        </div>

        {/* Next workout preview */}
        {nextDay && (
          <div id="next-workout-card" className={`border rounded-2xl p-4 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-pink-500" />
              <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${textMuted}`}>
                Próximo Entrenamiento
              </span>
            </div>
            <h2 className={`text-lg font-black ${textPrimary}`}>{nextDay.title}</h2>
            <p className={`text-xs font-mono ${textSecondary}`}>
              {nextDay.subtitle} · {nextDay.duration}
            </p>
          </div>
        )}

        {/* Quick stats */}
        <div className="flex gap-3">
          {[
            { label: "Sesiones", value: totalSessions, icon: Trophy },
            { label: "Racha", value: `${currentStreak} días`, icon: Flame },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className={`flex-1 border rounded-xl p-3 ${cardBg}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={12} className="text-pink-500" />
                <span className={`text-[10px] font-mono uppercase tracking-wider ${textMuted}`}>
                  {label}
                </span>
              </div>
              <p className={`text-xl font-black ${textPrimary}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Routine summary */}
        <div className={`border rounded-2xl p-4 ${cardBg}`}>
          <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-1 ${textMuted}`}>
            Tu Rutina
          </p>
          <p className={`text-sm font-semibold ${textPrimary}`}>
            {routine.length} días · {routine.reduce((acc, d) => acc + d.exercises.length, 0)} ejercicios
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {routine.map((day) => (
              <span key={day.id} className={`text-[10px] px-2 py-1 rounded-full font-mono border ${
                isDark ? "bg-zinc-800/80 text-zinc-400 border-zinc-700/60" : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}>
                {day.emoji} {day.dayLabel}
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
