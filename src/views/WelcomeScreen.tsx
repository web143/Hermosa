import { HeroColorPanelsRoot, HeroColorPanelsContainer } from "@/components/ui/hero-color-panel";
import { Lock, Heart } from "lucide-react";

interface WelcomeScreenProps {
  onSelectProfile: (profile: "haniel" | "novia") => void;
}

export default function WelcomeScreen({ onSelectProfile }: WelcomeScreenProps) {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center relative overflow-hidden">
      <HeroColorPanelsRoot
        title="OLYMPUS"
        subtitle="Shared Growth Engine"
        description="Selecciona tu perfil de entrenamiento para activar tus rutinas y las reglas de sobrecarga progresiva."
        desktopShaderProps={{
          colors: ["#18181b", "#27272a", "#1b111c", "#0c1c24"], // Deep luxurious palette
          speed: 1.2,
          density: 4,
        }}
      >
        <HeroColorPanelsContainer>
          <div className="w-full max-w-md mx-auto grid grid-cols-2 gap-4 px-6 z-50 mt-8">
            <button
              disabled
              className="py-6 rounded-2xl bg-zinc-900/10 backdrop-blur-md border border-zinc-900 text-zinc-600 font-bold tracking-widest flex flex-col items-center gap-2 cursor-not-allowed select-none opacity-40"
              title="Perfil no disponible por el momento"
            >
              <Lock size={24} className="text-zinc-700" />
              <span>HANIEL (🔒)</span>
            </button>
            <button
              onClick={() => onSelectProfile("novia")}
              className="group py-6 rounded-2xl bg-zinc-900/40 backdrop-blur-lg border border-zinc-800/80 text-pink-400 font-bold hover:bg-zinc-800/40 hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-950/20 transition-all duration-300 tracking-widest flex flex-col items-center gap-2"
            >
              <Heart size={24} className="text-zinc-500 group-hover:text-pink-400 transition-colors duration-300" />
              <span>HERMOSA</span>
            </button>
          </div>
        </HeroColorPanelsContainer>
      </HeroColorPanelsRoot>
    </main>
  );
}
