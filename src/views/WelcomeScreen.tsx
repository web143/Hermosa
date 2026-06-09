import { Lock, Heart, Zap, Moon, Sun } from "lucide-react";
import type { ProfileId } from "@/data/routines";
import type { Theme } from "@/App";

interface WelcomeScreenProps {
  theme: Theme;
  onSelectProfile: (profile: ProfileId) => void;
}

export default function WelcomeScreen({ theme, onSelectProfile }: WelcomeScreenProps) {
  const isDark = theme === "dark";

  return (
    <main className={`min-h-screen flex flex-col justify-center items-center relative overflow-hidden ${
      isDark ? "bg-zinc-950" : "bg-zinc-50"
    }`}>

      {/* Decorative bg blobs */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isDark ? "bg-pink-900" : "bg-pink-100"
      }`} />
      <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none ${
        isDark ? "bg-indigo-900" : "bg-violet-100"
      }`} />

      <div className="relative z-10 w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-8">

        {/* Logo / Brand */}
        <div className="text-center animate-slide-up">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4 ${
            isDark
              ? "bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700"
              : "bg-white border border-zinc-200 shadow-lg shadow-zinc-200/60"
          }`}>
            <span className="text-3xl">🏋️</span>
          </div>
          <h1 className={`text-5xl font-black tracking-tighter leading-none mb-1 ${
            isDark ? "text-white" : "text-zinc-900"
          }`}>
            GYM
          </h1>
          <p className={`text-sm font-mono tracking-widest ${
            isDark ? "text-zinc-500" : "text-zinc-400"
          }`}>
            PROGRESSIVE OVERLOAD ENGINE
          </p>
        </div>

        {/* Profile Cards */}
        <div className="w-full flex flex-col gap-3 animate-slide-up">
          <p className={`text-[10px] font-mono font-bold tracking-widest uppercase text-center mb-1 ${
            isDark ? "text-zinc-600" : "text-zinc-400"
          }`}>
            Selecciona tu perfil
          </p>

          {/* HANIEL — Locked */}
          <button
            disabled
            className={`w-full py-5 px-5 rounded-2xl flex items-center justify-between cursor-not-allowed opacity-40 ${
              isDark
                ? "bg-zinc-900/60 border border-zinc-800 text-zinc-500"
                : "bg-zinc-100 border border-zinc-200 text-zinc-400"
            }`}
            title="Sin rutina asignada actualmente"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark ? "bg-zinc-800" : "bg-zinc-200"
              }`}>
                <Lock size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black tracking-widest uppercase">HANIEL</p>
                <p className={`text-[10px] font-mono tracking-wider mt-0.5 ${
                  isDark ? "text-zinc-700" : "text-zinc-400"
                }`}>Sin rutina asignada</p>
              </div>
            </div>
            <Lock size={13} />
          </button>

          {/* ELLA — Active */}
          <button
            id="profile-ella-btn"
            onClick={() => onSelectProfile("ella")}
            className={`group w-full py-5 px-5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] shadow-sm ${
              isDark
                ? "bg-gradient-to-br from-zinc-900 to-pink-950/30 border border-zinc-700/60 hover:border-pink-500/50 hover:shadow-pink-950/30 hover:shadow-xl"
                : "bg-white border border-zinc-200 hover:border-pink-300 hover:shadow-pink-100/80 hover:shadow-xl"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark
                  ? "bg-pink-500/10 border border-pink-500/20 group-hover:bg-pink-500/20"
                  : "bg-pink-50 border border-pink-100 group-hover:bg-pink-100"
              } transition-colors`}>
                <Heart size={16} className="text-pink-500" />
              </div>
              <div className="text-left">
                <p className={`text-sm font-black tracking-widest uppercase ${
                  isDark ? "text-zinc-100" : "text-zinc-900"
                }`}>HERMOSA</p>
                <p className={`text-[10px] font-mono tracking-wider mt-0.5 ${
                  isDark ? "text-zinc-500" : "text-zinc-400"
                }`}>4 días · Rutina Completa Activa</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Zap size={14} className="text-pink-400 group-hover:text-pink-500 transition-colors" />
            </div>
          </button>
        </div>

        {/* Theme indicator */}
        <div className={`flex items-center gap-1.5 text-[10px] font-mono ${
          isDark ? "text-zinc-700" : "text-zinc-400"
        }`}>
          {isDark ? <Moon size={10} /> : <Sun size={10} />}
          Modo {isDark ? "Oscuro" : "Claro"} · 100% OFFLINE · IndexedDB
        </div>
      </div>
    </main>
  );
}
