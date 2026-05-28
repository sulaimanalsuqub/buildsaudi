"use client";

import { useEffect, useRef } from "react";

interface AuroraTextProps {
  children: string;
  className?: string;
}

export function AuroraText({ children, className = "" }: AuroraTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let t = 0;

    function resize() {
      const rect = container!.getBoundingClientRect();
      canvas!.width = rect.width;
      canvas!.height = rect.height;
    }

    function draw() {
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);

      // Brand colors: dark #1D3F1F, primary #09B14B, accent #C5D92D
      const grad = ctx!.createLinearGradient(
        Math.sin(t * 0.4) * w * 0.3 + w * 0.2,
        0,
        Math.cos(t * 0.3) * w * 0.3 + w * 0.7,
        h
      );
      grad.addColorStop(0, "#1D3F1F");
      grad.addColorStop(0.35 + Math.sin(t * 0.5) * 0.15, "#09B14B");
      grad.addColorStop(0.65 + Math.cos(t * 0.4) * 0.15, "#C5D92D");
      grad.addColorStop(1, "#09B14B");

      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, w, h);
      t += 0.018;
      animationId = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, []);

  return (
    <span ref={containerRef} className={`relative inline-block ${className}`}>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ mixBlendMode: "multiply" }}
        aria-hidden
      />
      <span className="relative">{children}</span>
    </span>
  );
}
