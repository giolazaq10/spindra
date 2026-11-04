export type CinemaCue =
  "spin" | "bonus" | "win" | "big" | "mega" | "epic" | "retrigger";
export type CinemaParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  delay: number;
  life: number;
  rotation: number;
  color: number;
  shape: "streak" | "coin" | "shard";
};
export const cinemaDuration = (cue: CinemaCue) =>
  cue === "spin"
    ? 3000
    : cue === "bonus"
      ? 5200
      : cue === "retrigger"
        ? 900
        : 4000;
/** Cosmetic randomness is isolated from the cash engine and its RNG. */
export function cinemaParticles(
  cue: CinemaCue,
  width: number,
  height: number,
  seed: number,
  compact = false,
) {
  let state = seed >>> 0 || 1;
  const random = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
  const count = compact
    ? cue === "spin"
      ? 36
      : 80
    : cue === "spin"
      ? 76
      : cue === "epic"
        ? 196
        : cue === "bonus"
          ? 170
          : cue === "mega"
            ? 154
            : 112;
  return Array.from({ length: count }, (_, i): CinemaParticle => {
    const angle = random() * Math.PI * 2,
      speed = 80 + random() * 240;
    const firework = cue === "epic" || cue === "bonus";
    return {
      x: width * (firework ? [0.25, 0.5, 0.75][i % 3] : 0.5),
      y:
        height *
        (cue === "spin" ? 0.48 : firework ? [0.4, 0.28, 0.4][i % 3] : 0.78),
      vx:
        cue === "spin"
          ? Math.cos(angle)
          : firework
            ? Math.cos(angle) * speed
            : (random() - 0.5) * 380,
      vy:
        cue === "spin"
          ? Math.sin(angle)
          : firework
            ? Math.sin(angle) * speed
            : -150 - random() * 300,
      size: cue === "spin" ? 1 + random() * 2 : 3 + random() * 6,
      delay: firework ? (i % 3) * 0.24 + random() * 0.4 : random() * 0.65,
      life: cue === "spin" ? 0.65 + random() * 0.8 : 1.8 + random() * 1.6,
      rotation: random() * Math.PI * 2,
      color: i % 4,
      shape: cue === "spin" ? "streak" : i % 3 ? "coin" : "shard",
    };
  });
}
export function cinemaPose(
  p: CinemaParticle,
  time: number,
  cue: CinemaCue,
  width: number,
  height: number,
) {
  let age = time - p.delay;
  if (cue === "spin") age = ((age % p.life) + p.life) % p.life;
  if (age < 0 || age > p.life) return null;
  const progress = age / p.life;
  const distance =
    cue === "spin"
      ? 8 + progress * progress * Math.hypot(width, height) * 0.8
      : age;
  return {
    x: p.x + p.vx * distance,
    y: p.y + p.vy * distance + (cue === "spin" ? 0 : 95 * age * age),
    alpha: Math.max(0, Math.min(1, age * 5, (1 - progress) * 3)),
    rotation: p.rotation + age * 3,
    stretch:
      cue === "spin"
        ? 8 + progress * 50
        : Math.max(0.2, Math.abs(Math.cos(age * 6 + p.rotation))),
  };
}
