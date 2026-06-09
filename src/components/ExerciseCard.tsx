// ExerciseCard is now superseded by ExerciseDetail (full-screen view).
// This file is kept as a lightweight stub for any future use.
// The main exercise interaction is in src/views/ExerciseDetail.tsx

import { ChevronRight } from "lucide-react";
import { getImageSrc } from "@/data/routines";

interface ExerciseCardProps {
  name: string;
  imageKey?: string;
  onClick?: () => void;
}

export default function ExerciseCard({ name, imageKey, onClick }: ExerciseCardProps) {
  const imgSrc = imageKey ? getImageSrc(imageKey) : "";

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-3 flex items-center gap-3 hover:bg-zinc-900/80 active:scale-[0.98] transition-all duration-150 group"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
        {imgSrc ? (
          <img src={imgSrc} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600">💪</div>
        )}
      </div>
      <p className="flex-1 text-sm font-semibold text-zinc-100 truncate">{name}</p>
      <ChevronRight size={16} className="text-zinc-600 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
    </button>
  );
}
