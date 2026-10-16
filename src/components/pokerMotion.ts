import type { CashRound } from "./CashGame";
export function pokerMotion(previous: CashRound | null, next: CashRound) {
  const target = next.view.table;
  if (!target?.players) return [];
  const old = previous?.id === next.id ? previous.view.table : undefined;
  const staged = structuredClone(next),
    table = staged.view.table!;
  staged.state = "open";
  staged.view.allowed = {};
  staged.view.returned_minor = 0;
  table.street = "dealing";
  table.board = structuredClone(old?.board || []);
  table.players = target.players.map((p, i) => ({
    ...p,
    hole: structuredClone(old?.players?.[i]?.hole || []),
  }));
  const frames = [{ at: 0, round: structuredClone(staged) }];
  let at = 100;
  const capture = () => {
    frames.push({ at, round: structuredClone(staged) });
    at += 300;
  };
  if (!old)
    for (let pass = 0; pass < 2; pass++)
      target.players.forEach((p, i) => {
        if (pass < p.hole.length) {
          table.players![i].hole.push(p.hole[pass]);
          capture();
        }
      });
  for (let i = table.board!.length; i < (target.board?.length || 0); i++) {
    table.board!.push(target.board![i]);
    capture();
  }
  if (old)
    target.players.forEach((p, i) =>
      p.hole.forEach((card, j) => {
        if (card !== null && table.players![i].hole[j] === null) {
          table.players![i].hole[j] = card;
          capture();
        }
      }),
    );
  if (frames.length === 1) return [{ at: 0, round: next }];
  frames.push({ at, round: next });
  return frames;
}
