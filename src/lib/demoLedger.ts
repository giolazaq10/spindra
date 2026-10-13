/** Session-only wallet. Round IDs make cleanup and late timers idempotent. */
export class DemoLedger {
  balance = 100000;
  loss = 0;
  limit = 50000;
  blocked = false;
  pending: { id: string; stake: number } | null = null;
  private completed = new Set<string>();
  reserve(amount: number, id: string) {
    if (
      this.blocked ||
      this.completed.has(id) ||
      (this.pending && this.pending.id !== id) ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      amount > this.balance ||
      this.loss + amount > this.limit
    )
      return false;
    this.balance -= amount;
    this.loss += amount;
    this.pending = { id, stake: (this.pending?.stake || 0) + amount };
    return true;
  }
  settle(id: string, returned: number) {
    if (!this.pending || this.pending.id !== id || this.completed.has(id))
      return null;
    if (!Number.isSafeInteger(returned) || returned < 0)
      throw new Error("Invalid demo settlement");
    const stake = this.pending.stake;
    this.pending = null;
    this.completed.add(id);
    this.balance += returned;
    this.loss = Math.max(0, this.loss - returned);
    return stake;
  }
  reset() {
    if (this.pending || this.blocked) return false;
    this.balance = 100000;
    this.loss = 0;
    return true;
  }
}
let nextId = 0;
export function demoRoundId() {
  return "demo-" + Date.now().toString(36) + "-" + (++nextId).toString(36);
}
