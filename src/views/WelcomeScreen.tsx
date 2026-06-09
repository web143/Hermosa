import { HeroColorPanelsRoot, HeroColorPanelsContainer } from "@/components/ui/hero-color-panel";
import { Lock, Heart, Zap } from "lucide-react";
import type { ProfileId } from "@/data/routines";

interface WelcomeScreenProps {
  onSelectProfile: (profile: ProfileId) => void;
}

export default function WelcomeScreen({ onSelectProfile }: WelcomeScreenProps) {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center relative overflow-hidden">
      <HeroColorPanelsRoot
        title="GYM"
        subtitle="Progressive Overload Engine"
        description="Selecciona tu perfil para activar tus rutinas personalizadas y el sistema de sobrecarga progresiva."
        desktopShaderProps={{
          colors: ["#09090b", "#18181b", "#1b0d24", "#0c0e24"],
          speed: 1.0,
          density: 4,
        }}
      >
        <HeroColorPanelsContainer>
          <div className="w-full max-w-sm mx-auto flex flex-col gap-4 px-6 z-50 mt-8 animate-slide-up">

            {/* HANIEL — Locked */}
            <div className="relative">
              <button
                disabled
                className="w-full py-5 px-6 rounded-2xl bg-zinc-900/20 backdrop-blur-md border border-zinc-800/40 text-zinc-600 font-bold tracking-widest flex items-center justify-between cursor-not-allowed opacity-40"
                title="Sin rutina asignada actualmente"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800/60 flex items-center justify-center">
                    <Lock size={18} className="text-zinc-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black tracking-widest text-zinc-500 uppercase">HANIEL</p>
                    <p className="text-[10px] font-mono text-zinc-700 tracking-wider mt-0.5">Sin rutina asignada</p>
                  </div>
                </div>
                <Lock size={14} className="text-zinc-700" />
              </button>
            </div>

            {/* ELLA — Active */}
            <button
              id="profile-ella-btn"
              onClick={() => onSelectProfile("ella")}
              className="group w-full py-5 px-6 rounded-2xl bg-gradient-to-br from-zinc-900/80 to-pink-950/20 backdrop-blur-lg border border-zinc-700/60 hover:border-pink-500/60 hover:shadow-2xl hover:shadow-pink-950/30 transition-all duration-300 flex items-center justify-between active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                  <Heart size={18} className="text-pink-400 group-hover:text-pink-300 transition-colors" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black tracking-widest text-zinc-100 uppercase group-hover:text-white transition-colors">HERMOSA</p>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-wider mt-0.5">4 días · Rutina Completa Activa</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Zap size={14} className="text-pink-400/60 group-hover:text-pink-400 transition-colors" />
              </div>
            </button>

            <p className="text-center text-[11px] text-zinc-600 font-mono tracking-wider mt-2">
              100% OFFLINE · IndexedDB · Sin conexión requerida
            </p>
          </div>
        </HeroColorPanelsContainer>
      </HeroColorPanelsRoot>
    </main>
  );
}
