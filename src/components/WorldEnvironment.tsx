import { memo, useEffect, useRef, useState } from "react";
import {
  actorState,
  motionTier,
  worldDirection,
  type WorldEvent,
} from "../lib/worldDirector";
import { WorldParticlePool, fishPose } from "../lib/worldMotion";
export default memo(function WorldEnvironment({
  scene,
  event,
}: {
  scene: string;
  event: WorldEvent;
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    pool = useRef(new WorldParticlePool()),
    pending = useRef(event);
  const [artReady, setArtReady] = useState(false);
  const symbolLoader = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const cabinet =
      symbolLoader.current?.closest<HTMLElement>(".slot-polished");
    if (cabinet && artReady) cabinet.dataset.environmentArtReady = "true";
    else if (cabinet) delete cabinet.dataset.environmentArtReady;
    return () => {
      if (cabinet) delete cabinet.dataset.environmentArtReady;
    };
  }, [artReady, scene]);
  useEffect(() => {
    const cabinet =
      symbolLoader.current?.closest<HTMLElement>(".slot-polished");
    if (cabinet) delete cabinet.dataset.symbolArtReady;
    return () => {
      if (cabinet) delete cabinet.dataset.symbolArtReady;
    };
  }, [scene]);
  useEffect(() => {
    pending.current = event;
  }, [event]);
  useEffect(() => {
    setArtReady(false);
  }, [scene]);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !window.CanvasRenderingContext2D) return;
    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = el.getContext("2d", { alpha: true });
    } catch {
      return;
    }
    if (!ctx) return;
    const context = ctx,
      surface = el,
      profile = worldDirection(scene),
      particles = pool.current;
    const fishArt =
      profile.atmosphere === "water" && typeof Image !== "undefined"
        ? new Image()
        : null;
    if (fishArt) fishArt.src = "/worlds/symbols-reef.webp";
    const waterline = scene === "moon" ? 0.45 : scene === "pirate" ? 0.35 : 0.2;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let width = 1,
      height = 1,
      frame = 0,
      previous = 0,
      time = 0,
      seen = -1,
      disposed = false,
      visible = true,
      tier = motionTier(!!media?.matches),
      slow = 0;
    const colors = ["#ffe49e", "#ff9bce", "#7eebed", "#efffb4"];
    const resize = () => {
      const rect = surface.getBoundingClientRect();
      width = Math.max(1, Math.min(rect.width, 1400));
      height = Math.max(1, Math.min(rect.height, 1100));
      tier = motionTier(
        !!media?.matches,
        navigator.hardwareConcurrency || 8,
        (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8,
        width,
      );
      surface.dataset.motionTier = tier;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        tier === "full" ? 1.5 : 1,
      );
      surface.width = Math.ceil(width * ratio);
      surface.height = Math.ceil(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (now: number) => {
      frame = 0;
      if (disposed || document.hidden || !visible || tier === "still") return;
      frame = requestAnimationFrame(draw);
      const minimum = tier === "full" ? 1000 / 60 : 1000 / 30;
      if (previous && now - previous < minimum) return;
      const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0.016;
      previous = now;
      time += dt;
      const began = performance.now();
      context.clearRect(0, 0, width, height);
      if (profile.atmosphere === "water") {
        for (let row = 0; row < 4; row++) {
          context.beginPath();
          for (let x = 0; x <= width; x += 12) {
            const y =
              height * (waterline + row * 0.035) +
              Math.sin(x * 0.018 + time * (0.5 + row * 0.2)) * 4;
            if (!x) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = `rgba(205,255,246,${0.18 - row * 0.025})`;
          context.lineWidth = 2;
          context.stroke();
        }
        for (let i = 0; i < (tier === "full" ? 4 : 2); i++) {
          const p = fishPose(time, i, width, height, waterline);
          context.save();
          context.translate(p.x, p.y);
          context.scale(p.flip * (1 + p.tail * 0.06), 1);
          context.rotate(p.tilt);
          context.globalAlpha = 0.75;
          if (fishArt?.complete && fishArt.naturalWidth) {
            const size = fishArt.naturalWidth / 3;
            context.drawImage(
              fishArt,
              0,
              0,
              size,
              fishArt.naturalHeight / 3,
              -22,
              -20,
              44,
              40,
            );
          }
          context.restore();
          if (p.splash) {
            context.globalAlpha = (1 - p.splash) * 0.4;
            context.strokeStyle = "#cafff3";
            context.lineWidth = 1.5;
            context.beginPath();
            context.ellipse(
              p.x,
              height * waterline,
              5 + p.splash * 30,
              2 + p.splash * 8,
              0,
              0,
              Math.PI * 2,
            );
            context.stroke();
            context.globalAlpha = 1;
          }
        }
      }
      const current = pending.current;
      if (current.id !== seen) {
        seen = current.id;
        const state = actorState(current);
        if (
          ["delighted", "cheer", "celebrate", "triumph", "bonus"].includes(
            state,
          )
        )
          particles.burst(
            Math.min(
              tier === "low" ? 24 : 64,
              state === "triumph"
                ? 64
                : state === "celebrate" || state === "bonus"
                  ? 40
                  : state === "cheer"
                    ? 28
                    : 16,
            ),
            width,
            height,
            current.id * 73 + scene.length,
          );
      }
      particles.step(dt, profile.atmosphere === "water" ? -30 : 160);
      for (const p of particles.particles)
        if (p.active) {
          context.save();
          context.globalAlpha = Math.min(1, (p.life - p.age) * 2) * 0.7;
          context.translate(p.x, p.y);
          context.rotate(p.rotation);
          context.fillStyle = colors[p.color];
          if (profile.atmosphere === "water") {
            context.strokeStyle = colors[p.color];
            context.lineWidth = 1.4;
            context.beginPath();
            context.arc(0, 0, p.size, 0, Math.PI * 2);
            context.stroke();
          } else if (profile.atmosphere === "leaves") {
            context.beginPath();
            context.ellipse(0, 0, p.size, p.size * 0.4, 0.4, 0, Math.PI * 2);
            context.fill();
          } else if (profile.atmosphere === "sugar") {
            context.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
            context.fillStyle = "#fff8";
            context.fillRect(-p.size / 2, -p.size, p.size * 0.3, p.size * 1.5);
          } else {
            context.beginPath();
            context.moveTo(0, -p.size);
            context.lineTo(p.size * 0.6, 0);
            context.lineTo(0, p.size);
            context.lineTo(-p.size * 0.6, 0);
            context.closePath();
            context.fill();
          }
          context.restore();
        }
      context.globalAlpha = 1;
      if (performance.now() - began > 12) slow++;
      else slow = Math.max(0, slow - 1);
      if (slow >= 12 && tier === "full") {
        tier = "low";
        surface.dataset.motionTier = tier;
      }
    };
    const resume = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (document.hidden || !visible || disposed || media?.matches) {
        particles.clear();
        context.clearRect(0, 0, width, height);
        return;
      }
      if (tier === "still") resize();
      frame = requestAnimationFrame(draw);
    };
    const changeMotion = () => {
      resize();
      resume();
    };
    resize();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(surface);
    const intersection =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;
              resume();
            },
            { rootMargin: "100px" },
          )
        : null;
    intersection?.observe(surface);
    document.addEventListener("visibilitychange", resume);
    media?.addEventListener?.("change", changeMotion);
    resume();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", resume);
      media?.removeEventListener?.("change", changeMotion);
      particles.clear();
      context.clearRect(0, 0, width, height);
    };
  }, [scene]);
  return (
    <div
      className={
        "directed-environment" + (artReady ? " environment-ready" : "")
      }
      data-environment={scene}
      aria-hidden="true"
    >
      <img
        className="directed-environment-art"
        src={`/worlds/${scene}.webp`}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setArtReady(true)}
        onError={() => setArtReady(false)}
      />
      <img
        ref={symbolLoader}
        className="world-symbol-preload"
        src={`/worlds/symbols-${scene}.webp`}
        alt=""
        decoding="async"
        onLoad={(e) => {
          const cabinet =
            e.currentTarget.closest<HTMLElement>(".slot-polished");
          if (cabinet) cabinet.dataset.symbolArtReady = "true";
        }}
        onError={(e) => {
          const cabinet =
            e.currentTarget.closest<HTMLElement>(".slot-polished");
          if (cabinet) delete cabinet.dataset.symbolArtReady;
        }}
      />
      <div className="directed-environment-light" />
      <canvas ref={canvas} />
    </div>
  );
});
