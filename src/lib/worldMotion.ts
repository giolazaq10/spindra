export type WorldParticle = {
  active: boolean;
  age: number;
  life: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  color: number;
};
/** A bounded reusable pool. No per-frame allocations and no connection to outcome RNG. */
export class WorldParticlePool {
  readonly particles: WorldParticle[];
  constructor(capacity = 64) {
    this.particles = Array.from(
      { length: Math.max(0, Math.min(96, capacity)) },
      () => ({
        active: false,
        age: 0,
        life: 0,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 0,
        rotation: 0,
        color: 0,
      }),
    );
  }
  burst(count: number, width: number, height: number, seed: number) {
    let cursor = 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (const p of this.particles) {
      if (p.active || cursor >= count) continue;
      Object.assign(p, {
        active: true,
        age: 0,
        life: 1.2 + random() * 1.5,
        x: width * (0.12 + random() * 0.76),
        y: height * (0.15 + random() * 0.4),
        vx: (random() - 0.5) * 180,
        vy: -80 - random() * 160,
        size: 3 + random() * 6,
        rotation: random() * Math.PI * 2,
        color: cursor % 4,
      });
      cursor++;
    }
    return cursor;
  }
  step(seconds: number, gravity = 180) {
    const dt = Math.max(0, Math.min(0.05, seconds));
    for (const p of this.particles)
      if (p.active) {
        p.age += dt;
        if (p.age >= p.life) {
          p.active = false;
          continue;
        }
        p.vy += gravity * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.vx * 0.01 * dt;
      }
  }
  clear() {
    for (const p of this.particles) p.active = false;
  }
}
export function fishPose(
  time: number,
  index: number,
  width: number,
  height: number,
  surface = 0.2,
) {
  const period = 11 + index * 3,
    phase = (time / period + index * 0.31) % 2,
    forward = phase < 1;
  const travel = forward ? phase : 2 - phase;
  const cycle = (time + index * 9) % 19,
    depth = 0.05 + index * 0.06;
  const jump =
    index === 0 && cycle < 1.4
      ? Math.sin((cycle / 1.4) * Math.PI) * (depth + 0.07)
      : 0;
  return {
    x: width * (-0.08 + travel * 1.16),
    y: height * (surface + depth - jump) + Math.sin(time * 0.9 + index) * 5,
    tilt: jump
      ? Math.cos((cycle / 1.4) * Math.PI) * -0.35
      : Math.sin(time * 0.9 + index) * 0.04,
    splash: index === 0 && cycle >= 1.4 && cycle < 2.4 ? cycle - 1.4 : 0,
    flip: forward ? 1 : -1,
    tail: Math.sin(time * 7 + index) * 0.18,
  };
}
