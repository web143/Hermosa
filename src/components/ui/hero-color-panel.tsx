import React, { useEffect, useRef } from "react";

interface ShaderProps {
  colors: string[];
  speed?: number;
  density?: number;
}

interface HeroColorPanelsRootProps {
  title: string;
  subtitle?: string;
  description?: string;
  desktopShaderProps?: ShaderProps;
  children: React.ReactNode;
}

export const HeroColorPanelsRoot: React.FC<HeroColorPanelsRootProps> = ({
  title,
  subtitle,
  description,
  desktopShaderProps = {
    colors: ["#09090b", "#18181b", "#27272a", "#3f3f46"],
    speed: 1.5,
    density: 3,
  },
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Dynamic color particle system simulating a shader
    const colors = desktopShaderProps.colors || ["#09090b", "#18181b", "#27272a", "#3f3f46"];
    const speed = desktopShaderProps.speed || 1.5;
    const density = desktopShaderProps.density || 3;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
    }

    const particles: Particle[] = [];
    const particleCount = density * 5;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * (width * 0.4) + width * 0.2,
        color: colors[i % colors.length],
      });
    }

    const render = () => {
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, width, height);

      // Draw blur glow fields
      ctx.globalCompositeOperation = "screen";
      particles.forEach((p) => {
        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x - p.radius < 0 || p.x + p.radius > width) p.vx *= -1;
        if (p.y - p.radius < 0 || p.y + p.radius > height) p.vy *= -1;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color + "44"); // alpha transparency
        grad.addColorStop(0.5, p.color + "11");
        grad.addColorStop(1, "transparent");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [desktopShaderProps]);

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex flex-col justify-center items-center select-none bg-zinc-950">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />
      <div className="relative z-10 text-center max-w-xl px-4 flex flex-col items-center">
        {subtitle && (
          <span className="text-xs uppercase tracking-widest text-amber-500 font-mono mb-2 px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/5 animate-pulse">
            {subtitle}
          </span>
        )}
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 tracking-tighter drop-shadow-xl select-none">
          {title}
        </h1>
        {description && (
          <p className="mt-4 text-sm md:text-base text-zinc-400 font-light tracking-wide max-w-md">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
};

export const HeroColorPanelsContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <div className="w-full mt-6">{children}</div>;
};
