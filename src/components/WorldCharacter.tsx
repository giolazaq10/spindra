import RigFace from "./RigFace";
import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import {
  actorState,
  idleDelay,
  reactionDuration,
  worldDirection,
  type ActorState,
  type WorldEvent,
} from "../lib/worldDirector";
const neutral: Keyframe[] = [
  { transform: "rotate(0deg) translateY(0)" },
  { transform: "rotate(0deg) translateY(0)" },
];
const choreography: Record<
  ActorState,
  { head: Keyframe[]; left: number; right: number; lift: number }
> = {
  idle: { head: neutral, left: 0, right: 0, lift: 0 },
  anticipation: {
    head: [
      { transform: "rotate(-3deg) translateY(0)" },
      { transform: "rotate(5deg) translateY(2px)" },
    ],
    left: 10,
    right: -12,
    lift: 1,
  },
  neutral: {
    head: [
      { transform: "rotate(0deg)" },
      { transform: "rotate(3deg)" },
      { transform: "rotate(0deg)" },
    ],
    left: 4,
    right: -4,
    lift: 0,
  },
  disappointed: {
    head: [
      { transform: "rotate(0deg) translateY(0)" },
      { transform: "rotate(-7deg) translateY(4px)" },
      { transform: "rotate(0deg) translateY(0)" },
    ],
    left: -5,
    right: 5,
    lift: 2,
  },
  delighted: {
    head: [
      { transform: "rotate(-5deg) translateY(0)" },
      { transform: "rotate(5deg) translateY(-3px)" },
      { transform: "rotate(0deg) translateY(0)" },
    ],
    left: 16,
    right: -22,
    lift: -3,
  },
  cheer: {
    head: [
      { transform: "rotate(-5deg)" },
      { transform: "rotate(6deg) translateY(-4px)" },
      { transform: "rotate(0deg)" },
    ],
    left: 23,
    right: -30,
    lift: -4,
  },
  celebrate: {
    head: [
      { transform: "rotate(-6deg)" },
      { transform: "rotate(7deg)" },
      { transform: "rotate(0deg)" },
    ],
    left: 32,
    right: -40,
    lift: -6,
  },
  triumph: {
    head: [
      { transform: "rotate(-8deg) translateY(-2px)" },
      { transform: "rotate(8deg) translateY(-5px)" },
      { transform: "rotate(0deg) translateY(0)" },
    ],
    left: 45,
    right: -55,
    lift: -9,
  },
  bonus: {
    head: [
      { transform: "rotate(-4deg)" },
      { transform: "rotate(4deg) translateY(-3px)" },
      { transform: "rotate(0deg)" },
    ],
    left: 26,
    right: -48,
    lift: -5,
  },
};
export default memo(function WorldCharacter({
  scene,
  event,
}: {
  scene: string;
  event: WorldEvent;
}) {
  const profile = worldDirection(scene),
    root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false),
    [pose, setPose] = useState<ActorState>("idle");
  const asset = `/worlds/rig-${profile.character}.webp`;
  useEffect(() => {
    setReady(false);
  }, [asset]);
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const animations = new Set<Animation>();
    const began = performance.now();
    let visible = true;
    let disposed = false,
      blinkTimer: ReturnType<typeof setTimeout> | undefined,
      poseTimer: ReturnType<typeof setTimeout> | undefined;
    const animate = (
      selector: string,
      frames: Keyframe[],
      options: KeyframeAnimationOptions,
    ) => {
      el.querySelectorAll<HTMLElement>(selector).forEach((part) => {
        if (!part.animate) return;
        const animation = part.animate(frames, options);
        animations.add(animation);
        animation.onfinish = () => animations.delete(animation);
      });
    };
    const stop = () => {
      animations.forEach((a) => a.cancel());
      animations.clear();
      clearTimeout(blinkTimer);
      clearTimeout(poseTimer);
    };
    const blink = () => {
      if (disposed || document.hidden || media?.matches) return;
      animate(
        ".rig-eyelids",
        [
          { transform: "scaleY(1)" },
          { transform: "scaleY(.06)", offset: 0.45 },
          { transform: "scaleY(1)" },
        ],
        { duration: 150, easing: "ease-in-out" },
      );
      const look = (Math.random() - 0.5) * 2.4;
      animate(
        ".rig-pupils",
        [
          { transform: "translateX(0)" },
          { transform: `translateX(${look}px)`, offset: 0.3 },
          { transform: "translateX(0)" },
        ],
        { duration: 1400, easing: "ease-in-out" },
      );
      blinkTimer = setTimeout(blink, idleDelay());
    };
    const start = () => {
      stop();
      if (disposed || document.hidden || !visible) return;
      const initial = actorState(event);
      const next =
        initial !== "anticipation" &&
        performance.now() - began > reactionDuration(initial)
          ? "idle"
          : initial;
      setPose(next);
      if (media?.matches) return;
      animate(
        ".rig-breath",
        [
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-1.8px) scale(1.005,1.012)" },
          { transform: "translateY(0) scale(1)" },
        ],
        { duration: 4300, iterations: Infinity, easing: "ease-in-out" },
      );
      const c = choreography[next],
        duration = next === "anticipation" ? 1100 : reactionDuration(next);
      const signatureScale =
        profile.signature === "summon"
          ? 1.2
          : profile.signature === "stir"
            ? 0.75
            : profile.signature === "cast"
              ? 1.1
              : 1;
      animate(".rig-head-motion", c.head, {
        duration,
        iterations: next === "anticipation" ? Infinity : 1,
        easing: "cubic-bezier(.22,1,.36,1)",
      });
      for (const [selector, angle] of [
        [".rig-left", c.left],
        [".rig-right", c.right],
      ] as const)
        animate(
          selector,
          [
            { transform: "rotate(0deg)" },
            {
              transform: `rotate(${angle * signatureScale}deg) translateY(${c.lift}px)`,
              offset: 0.38,
            },
            { transform: "rotate(0deg)" },
          ],
          {
            duration,
            iterations: next === "anticipation" ? Infinity : 1,
            easing: "cubic-bezier(.22,1.15,.4,1)",
          },
        );
      if (profile.signature === "cast" && next !== "idle") {
        animate(
          ".rig-rod-shaft",
          [
            { d: 'path("M66 190Q145 93 118 8")' },
            { d: 'path("M66 190Q172 101 103 16")' },
            { d: 'path("M66 190Q145 93 118 8")' },
          ],
          { duration, easing: "ease-in-out" },
        );
        animate(
          ".rig-line",
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-4px) scaleX(.96)" },
            { transform: "translateX(0)" },
          ],
          { duration: duration + 180, easing: "ease-in-out" },
        );
      }
      animate(
        ".rig-secondary",
        [
          { transform: "rotate(0deg)" },
          { transform: `rotate(${c.right * 0.18}deg)` },
          { transform: "rotate(0deg)" },
        ],
        { duration: duration + 240, easing: "ease-in-out" },
      );
      blinkTimer = setTimeout(blink, idleDelay());
      if (next !== "anticipation" && next !== "idle")
        poseTimer = setTimeout(() => {
          if (!disposed) setPose("idle");
        }, duration);
    };
    start();
    const observer =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              visible = entries[0]?.isIntersecting ?? true;
              start();
            },
            { rootMargin: "100px" },
          )
        : null;
    observer?.observe(el);
    document.addEventListener("visibilitychange", start);
    media?.addEventListener?.("change", start);
    return () => {
      disposed = true;
      stop();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", start);
      media?.removeEventListener?.("change", start);
    };
  }, [event, scene, profile.signature]);
  return (
    <div
      ref={root}
      className={
        "world-character character-" +
        profile.character +
        (ready ? " character-ready" : "")
      }
      data-actor-state={pose}
      data-signature={profile.signature}
      aria-hidden="true"
      style={{ "--rig-atlas": `url("${asset}")` } as CSSProperties}
    >
      <img
        className="rig-preload"
        src={asset}
        alt=""
        decoding="async"
        loading="lazy"
        onLoad={() => setReady(true)}
        onError={() => setReady(false)}
      />
      <div className="rig-breath">
        <div className="rig-left rig-limb">
          <div className="rig-part rig-left-texture" />
        </div>
        <div className="rig-right rig-limb">
          <div className="rig-part rig-right-texture" />
          {profile.signature === "cast" && (
            <svg
              className="rig-fishing-rod rig-secondary"
              viewBox="0 0 180 220"
            >
              <path className="rig-rod-shaft" d="M66 190Q145 93 118 8" />
              <path className="rig-line" d="M118 8Q178 61 155 209" />
              <ellipse className="rig-float" cx="155" cy="209" rx="4" ry="7" />
            </svg>
          )}
        </div>
        <div className="rig-body rig-part" />
        <div className="rig-head-motion">
          <div className="rig-head rig-part" />
          <RigFace rig={profile.character} />
        </div>
      </div>
      <div className="world-character-caption">
        <b>{profile.name}</b>
        <span>{profile.role}</span>
      </div>
    </div>
  );
});
