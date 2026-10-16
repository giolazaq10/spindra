export type CashHistoryRound = {
  id: string;
  game: string;
  state: string;
  stake_minor: number;
  returned_minor: number;
  created_at: string;
};
type Snapshot = { rounds: CashHistoryRound[]; loading: boolean; error: string };
type Entry = {
  snapshot: Snapshot;
  listeners: Set<() => void>;
  pending: Promise<void> | null;
  version: number;
  changed: Map<string, number>;
  revisions: Map<string, number>;
  loaded: boolean;
};
const entries = new Map<string, Entry>();
const empty: Snapshot = { rounds: [], loading: false, error: "" };
function entry(owner: string) {
  let e = entries.get(owner);
  if (!e) {
    e = {
      snapshot: { rounds: [], loading: true, error: "" },
      listeners: new Set(),
      pending: null,
      version: 0,
      changed: new Map(),
      revisions: new Map(),
      loaded: false,
    };
    entries.set(owner, e);
  }
  return e;
}
function update(e: Entry, s: Snapshot) {
  e.snapshot = s;
  e.listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* A view subscriber cannot fail a confirmed financial response. */
    }
  });
}
export const cashFeedSnapshot = (owner?: string) =>
  owner ? entry(owner).snapshot : empty;
export function subscribeCashFeed(
  owner: string | undefined,
  listener: () => void,
) {
  if (!owner) return () => {};
  const e = entry(owner);
  e.listeners.add(listener);
  return () => {
    e.listeners.delete(listener);
  };
}
export function recordCashSession(owner: string, value: unknown) {
  const r = value as {
    id?: string;
    game?: string;
    state?: string;
    revision?: number;
    replayed?: boolean;
    created_at?: string;
    view?: { stake_minor: number; returned_minor: number };
  };
  if (
    !r?.id ||
    !r.game ||
    !["open", "settled"].includes(r.state || "") ||
    !r.view ||
    !Number.isSafeInteger(r.view.stake_minor) ||
    !Number.isSafeInteger(r.view.returned_minor)
  )
    return;
  const e = entry(owner),
    previous = e.snapshot.rounds.find((v) => v.id === r.id),
    revision = r.revision ?? 0;
  if (r.replayed && !previous) return;
  if (
    (e.revisions.get(r.id) ?? -1) > revision ||
    (previous?.state === "settled" && r.state === "open")
  )
    return;
  e.revisions.set(r.id, revision);
  e.changed.set(r.id, ++e.version);
  const row: CashHistoryRound = {
    id: r.id,
    game: r.game,
    state: r.state!,
    stake_minor: r.view.stake_minor,
    returned_minor: r.view.returned_minor,
    created_at:
      r.created_at || previous?.created_at || new Date().toISOString(),
  };
  const rounds = [row, ...e.snapshot.rounds.filter((v) => v.id !== row.id)]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);
  const keep = new Set(rounds.map((row) => row.id));
  for (const id of e.changed.keys())
    if (!keep.has(id)) {
      e.changed.delete(id);
      e.revisions.delete(id);
    }
  update(e, { rounds, loading: false, error: "" });
}
export function loadCashFeed(
  owner: string,
  fetcher: () => Promise<{ rounds: CashHistoryRound[] }>,
  force = false,
) {
  const e = entry(owner);
  if (e.pending) return e.pending;
  if (e.loaded && !force) return Promise.resolve();
  const version = e.version;
  e.pending = (async () => {
    try {
      const result = await Promise.resolve().then(fetcher);
      const rows = new Map(result.rounds.map((r) => [r.id, r]));
      for (const r of e.snapshot.rounds)
        if ((e.changed.get(r.id) || 0) > version) rows.set(r.id, r);
      e.loaded = true;
      update(e, {
        rounds: [...rows.values()]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .slice(0, 50),
        loading: false,
        error: "",
      });
    } catch (error) {
      update(e, {
        ...e.snapshot,
        loading: false,
        error: error instanceof Error ? error.message : "History unavailable",
      });
    } finally {
      e.pending = null;
    }
  })();
  return e.pending;
}
