import { Flame, Trophy, Quote } from "lucide-react";
import { getRoutineForProfile } from "@/data/routines";
import type { ProfileId } from "@/data/routines";
import { getTotalSessions, getCurrentStreak } from "@/db/profileStore";

const VERSES = [
  { text: "Ya te lo he ordenado: ¡Sé fuerte y valiente! No tengas miedo ni te desanimes, porque el Señor tu Dios te acompañará dondequiera que vayas.", ref: "Josué 1:9" },
  { text: "Él fortalece al cansado y acrecienta las fuerzas del débil.", ref: "Isaías 40:29" },
  { text: "El Señor es mi fuerza y mi escudo; mi corazón en él confía; de él recibo ayuda.", ref: "Salmo 28:7" },
  { text: "Todo lo puedo en aquel que me da fuerza.", ref: "Filipenses 4:13" },
  { text: "Pero él me dijo: «Te basta con mi gracia, pues mi poder se perfecciona en la debilidad».", ref: "2 Corintios 12:9" },
  { text: "El Señor es mi luz y mi salvación; ¿a quién temeré? El Señor es el baluarte de mi vida; ¿quién podrá amedrentarme?", ref: "Salmo 27:1" },
  { text: "A los que confían en el Señor les sucederá lo mismo: volarán como las águilas, correrán y no se fatigarán, caminarán y no se cansarán.", ref: "Isaías 40:31" },
  { text: "Busquen al Señor y su fuerza; busquen siempre su rostro.", ref: "1 Crónicas 16:11" },
  { text: "Tú eres mi refugio y mi escudo; Dios mío, en ti confío.", ref: "Salmo 91:2" },
  { text: "Dios es nuestro amparo y nuestra fortaleza, nuestra ayuda segura en momentos de angustia.", ref: "Salmo 46:1" },
  { text: "El Dios eterno es tu refugio, y sus brazos eternos te sostienen.", ref: "Deuteronomio 33:27" },
  { text: "El Señor dará fuerza a su pueblo; el Señor bendecirá a su pueblo con paz.", ref: "Salmo 29:11" },
  { text: "Manténganse alerta; permanezcan firmes en la fe; sean valientes y fuertes.", ref: "1 Corintios 16:13" },
  { text: "No temas, porque yo estoy contigo; no te angusties, porque yo estoy contigo; yo te fortalezco y te ayudo.", ref: "Isaías 41:10" },
  { text: "Tú, Señor, eres mi lámpara; tú, Dios mío, iluminas mis tinieblas. Con tu apoyo me lanzo contra un ejército.", ref: "2 Samuel 22:29-30" },
  { text: "El Señor es bueno, es un refugio en el día de la angustia; protege a los que en él confían.", ref: "Nahúm 1:7" },
  { text: "Por lo tanto, no te avergüences de dar testimonio de nuestro Señor... Al contrario, comparte conmigo los sufrimientos por el evangelio, según el poder de Dios.", ref: "2 Timoteo 1:8" },
  { text: "Mi carne y mi corazón pueden desfallecer, pero Dios es la fortaleza de mi corazón y mi porción para siempre.", ref: "Salmo 73:26" },
  { text: "Guíame por el camino de tus mandamientos, porque en él encuentro mi deleite. Fortaléceme conforme a tu palabra.", ref: "Salmo 119:35,28" },
  { text: "Hijo mío, fortalécete con la gracia que tenemos en Cristo Jesús.", ref: "2 Timoteo 2:1" },
  { text: "El Señor es mi fuerza y mi cántico; él es mi salvación. Él es mi Dios, y lo alabaré.", ref: "Éxodo 15:2" },
  { text: "Por eso me complazco en las debilidades, insultos, privaciones, persecuciones y angustias por amor a Cristo; porque cuando soy débil, entonces soy fuerte.", ref: "2 Corintios 12:10" },
  { text: "Alábenlo por sus proezas; alábenlo por su inmensa grandeza... ¡Que todo lo que respira alabe al Señor!", ref: "Salmo 150:2,6" },
  { text: "El SEÑOR es la fuerza de su pueblo, un baluarte de salvación para su ungido.", ref: "Salmo 28:8" },
  { text: "Confíen en el Señor para siempre, porque el Señor es la Roca eterna.", ref: "Isaías 26:4" },
  { text: "Me diste el escudo de tu salvación; tu mano derecha me sostiene y tu bondad me ha hecho prosperar.", ref: "Salmo 18:35" },
  { text: "Bendito el hombre que confía en el Señor, y cuya confianza es el Señor. Será como un árbol plantado junto al agua.", ref: "Jeremías 17:7-8" },
  { text: "Sean fuertes y valientes, todos los que esperan en el Señor.", ref: "Salmo 31:24" },
  { text: "Por lo demás, fortalézcanse con el gran poder del Señor. Pónganse toda la armadura de Dios.", ref: "Efesios 6:10-11" },
  { text: "¡Alaben al Señor, porque él es bueno; su gran amor perdura para siempre!", ref: "Salmo 118:1" },
];

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

  const verseIndex = (new Date().getDate() - 1) % VERSES.length;
  const dailyVerse = VERSES[verseIndex];

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

        {/* ── Daily Bible Verse ───────────────────────────────── */}
        <div className={`border rounded-2xl p-5 ${cardBg}`}>
          <div className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isDark ? "bg-zinc-800" : "bg-zinc-100"
            }`}>
              <Quote size={16} className={isDark ? "text-zinc-400" : "text-zinc-500"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-base font-semibold leading-relaxed ${textPrimary}`}>
                "{dailyVerse.text}"
              </p>
              <p className={`text-xs font-mono mt-2 ${textSecondary}`}>
                — {dailyVerse.ref} <span className={textMuted}>(NVI)</span>
              </p>
            </div>
          </div>
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
