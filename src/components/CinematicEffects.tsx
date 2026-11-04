import { useEffect, useRef } from "react";
import {
  cinemaDuration,
  cinemaParticles,
  cinemaPose,
  type CinemaCue,
} from "../lib/cinematicParticles";
export default function CinematicEffects({ cue }: { cue: CinemaCue }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (
      !el ||
      !window.CanvasRenderingContext2D ||
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = el.getContext("2d", { alpha: true });
    } catch {
      return;
    }
    if (!ctx) return;
    const surface = el;
    const context = ctx;
    const colors = getComputedStyle(el);
    const palette = [
      colors.getPropertyValue("--slot-primary").trim() || "#ffd271",
      colors.getPropertyValue("--slot-secondary").trim() || "#d58dff",
      "#9ff4ff",
      "#fff1bd",
    ];
    let width = 0,
      height = 0,
      frame = 0,
      last = -Infinity,
      disposed = false;
    const began = performance.now(),
      duration = cinemaDuration(cue);
    let particles = cinemaParticles(cue, 1, 1, 1);
    function resize() {
      const rect = surface.getBoundingClientRect();
      width = Math.max(1, Math.min(1100, rect.width));
      height = Math.max(1, Math.min(800, rect.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      surface.width = Math.ceil(width * ratio);
      surface.height = Math.ceil(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = cinemaParticles(
        cue,
        width,
        height,
        Math.floor(began) + Math.floor(width),
        rect.width < 600,
      );
    }
    function draw(now: number) {
      if (disposed || document.hidden) return;
      const elapsed = now - began;
      if (elapsed > duration) {
        context.clearRect(0, 0, width, height);
        return;
      }
      frame = requestAnimationFrame(draw);
      if (now - last < 1000 / 30) return;
      last = now;
      const time = elapsed / 1000;
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = "lighter";
      if (cue !== "spin" && time < 1.5) {
        for (let ring = 0; ring < 2; ring++) {
          const t = Math.max(0, time - ring * 0.16);
          context.globalAlpha = Math.max(0, 0.55 - t * 0.4);
          context.strokeStyle = palette[ring];
          context.lineWidth = 5;
          context.beginPath();
          context.ellipse(
            width / 2,
            height / 2,
            Math.max(1, t * width * 0.65),
            Math.max(1, t * height * 0.65),
            0,
            0,
            Math.PI * 2,
          );
          context.stroke();
        }
      }
      for (const p of particles) {
        const pose = cinemaPose(p, time, cue, width, height);
        if (
          !pose ||
          pose.x < -70 ||
          pose.x > width + 70 ||
          pose.y > height + 70
        )
          continue;
        context.globalAlpha = pose.alpha * 0.8;
        context.fillStyle = context.strokeStyle = palette[p.color];
        context.save();
        context.translate(pose.x, pose.y);
        if (p.shape === "streak") {
          context.lineWidth = p.size;
          context.beginPath();
          context.moveTo(0, 0);
          context.lineTo(p.vx * pose.stretch, p.vy * pose.stretch);
          context.stroke();
        } else {
          context.rotate(pose.rotation);
          if (p.shape === "coin") {
            context.beginPath();
            context.ellipse(
              0,
              0,
              p.size * pose.stretch,
              p.size,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.globalAlpha *= 0.7;
            context.strokeStyle = "#fff4c9";
            context.lineWidth = 1;
            context.stroke();
          } else {
            context.beginPath();
            context.moveTo(0, -p.size * 1.8);
            context.lineTo(p.size, 0);
            context.lineTo(0, p.size * 1.8);
            context.lineTo(-p.size, 0);
            context.closePath();
            context.fill();
          }
        }
        context.restore();
      }
      context.globalAlpha = 1;
    }
    resize();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(el);
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !disposed && performance.now() - began < duration)
        frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", visibility);
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      context.clearRect(0, 0, width, height);
    };
  }, [cue]);
  return (
    <div className={"cinematic-effects cinema-" + cue} aria-hidden="true">
      <canvas ref={canvas} />
      <i className="cinema-lens-flare" />
      {cue !== "spin" && cue !== "win" && (
        <>
          <i className="cinema-letterbox letterbox-top" />
          <i className="cinema-letterbox letterbox-bottom" />
        </>
      )}
    </div>
  );
}
