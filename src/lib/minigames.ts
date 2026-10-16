import { randomInt, type RandomInt } from "./engine";
export type MiniKind = "dice" | "plinko" | "wheel";
export type MiniResult = {
  balance_minor?: number;
  type: MiniKind;
  returned_minor: number;
  multiplier: number;
  roll?: number;
  threshold?: number;
  over?: boolean;
  path?: number[];
  bin?: number;
  sector?: number;
};
export const wheelPays = [
  0, 100, 0, 150, 0, 100, 0, 200, 0, 340, 0, 100, 0, 150, 0, 200, 0, 100, 0,
  500,
];
export const plinkoPays = [1000, 350, 140, 60, 40, 60, 140, 350, 1000];
export function miniPlay(
  type: MiniKind,
  stake: number,
  input: Record<string, unknown> = {},
  rng: RandomInt = randomInt,
): MiniResult {
  if (
    !Number.isSafeInteger(stake) ||
    stake < 100 ||
    stake > 20000 ||
    stake % 100
  )
    throw new Error("Invalid minigame stake");
  if (type === "dice") {
    const threshold = input.threshold ?? 5000;
    if (
      !Number.isInteger(threshold) ||
      Number(threshold) < 500 ||
      Number(threshold) > 9500 ||
      (input.over !== undefined && typeof input.over !== "boolean")
    )
      throw new Error("Invalid dice chance");
    const target = Number(threshold),
      over = input.over === true,
      roll = rng(10000);
    const win = over ? roll >= 10000 - target : roll < target;
    const returned_minor = win ? Math.floor((stake * 9700) / target) : 0;
    return {
      type,
      roll,
      threshold: target,
      over,
      multiplier: returned_minor / stake,
      returned_minor,
    };
  }
  if (type === "plinko") {
    const path = Array.from({ length: 8 }, () => rng(2));
    const bin = path.reduce((a, b) => a + b, 0),
      rate = plinkoPays[bin];
    return {
      type,
      path,
      bin,
      multiplier: rate / 100,
      returned_minor: (stake / 100) * rate,
    };
  }
  if (type === "wheel") {
    const sector = rng(20),
      rate = wheelPays[sector];
    return {
      type,
      sector,
      multiplier: rate / 100,
      returned_minor: (stake / 100) * rate,
    };
  }
  throw new Error("Unknown minigame");
}
export function miniRules(type: MiniKind) {
  return type === "dice"
    ? "A uniform roll from 0.00 to 99.99. Choose 5–95% chance. Under wins below your chance; Over wins at or above 100 minus your chance. Winning return is stake × 97 ÷ chance percent, rounded down to a cent. Returns include stake. Theoretical RTP is at most 97%; cent rounding lowers it slightly for some stakes."
    : type === "plinko"
      ? "Eight independent left/right decisions with equal probability. The final bin equals the number of right moves. Returns from left to right: 10×, 3.5×, 1.4×, 0.6×, 0.4×, 0.6×, 1.4×, 3.5×, 10×. Edge bins are much rarer than the middle. Theoretical RTP: 97.50%. Animation illustrates the saved result; it does not determine it."
      : "Twenty equally likely sectors: ten 0×, four 1×, two 1.5×, two 2×, one 3.4× and one 5×. Each return includes stake; 0× loses the stake and 1× returns it. Theoretical RTP: 97.00%. The pointer indicates the saved sector.";
}
