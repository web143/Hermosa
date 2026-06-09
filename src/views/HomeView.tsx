import { motion, type Variants } from "framer-motion";
import { ChevronRight, Flame, BarChart2, Trophy } from "lucide-react";
import { getRoutineForProfile, getImageSrc } from "@/data/routines";
import type { ProfileId, RoutineDay } from "@/data/routines";
import { getTotalSessions } from "@/db/profileStore";

interface HomeViewProps {
  profile: ProfileId;
  theme: "light" | "dark";
  onSelectDay: (day: RoutineDay) => void;
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24, delay: i * 0.08 },
  }),
};

export default function HomeView({ profile, theme, onSelectDay }: HomeViewProps) {
  const isDark = theme === "dark";
  const isElla = profile === "ella";
  const routine = getRoutineForProfile(profile);
  const profileName = isElla ? "HERMOSA" : "HANIEL";
  const totalSessions = getTotalSessions(profile);

  const bg = isDark ? "bg-zinc-950" : "bg-zinc-50";
  const textPrimary = isDark ? "text-zinc-100" : "text-zinc-900";
  const textSecondary = isDark ? "text-zinc-400" : "text-zinc-500";
  const textMuted = isDark ? "text-zinc-600" : "text-zinc-400";
  const cardBg = isDark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-zinc-200";

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Buenos días" : today.getHours() < 18 ? "Buenas tardes" : "Buenas noches";
  const nextDay = routine.find(() => true) || routine[0];

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
          <div
            id="next-workout-card"
            className={`border rounded-2xl p-4 ${cardBg}`}
          >
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
            { label: "Rutina", value: `${routine.length} días`, icon: BarChart2 },
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

        {/* Day Cards */}
        <section>
          <h2 className={`text-xs font-bold tracking-widest uppercase mb-3 font-mono ${textMuted}`}>
            📋 TU RUTINA — {routine.length} DÍAS
          </h2>
          <div className="space-y-3">
            {routine.map((day, idx) => (
              <DayCard
                key={day.id}
                day={day}
                index={idx}
                isElla={isElla}
                isDark={isDark}
                onClick={() => onSelectDay(day)}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function DayCard({ day, index, isElla, isDark, onClick }: {
  day: RoutineDay; index: number; isElla: boolean; isDark: boolean; onClick: () => void;
}) {
  const imgSrc = getImageSrc(day.heroBg);
  const accentGradient = isElla ? "from-pink-600/70 to-rose-700/50" : "from-amber-500/70 to-orange-600/50";

  return (
    <motion.button
      id={`day-card-${index}`}
      onClick={onClick}
      variants={cardVariants}
      custom={index}
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
}
