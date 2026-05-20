export class BatchProcessor {
  private batchSize: number;
  private pending: Array<() => void> = [];
  private scheduled = false;

  constructor(batchSize = 16) {
    this.batchSize = batchSize;
  }

  add(fn: () => void): void {
    this.pending.push(fn);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => this.process());
  }

  private process(): void {
    this.scheduled = false;
    const batch = this.pending.splice(0, this.batchSize);
    for (const fn of batch) {
      fn();
    }
    if (this.pending.length > 0) {
      this.schedule();
    }
  }

  processAll(): void {
    for (const fn of this.pending) {
      fn();
    }
    this.pending.length = 0;
    this.scheduled = false;
  }

  get size(): number {
    return this.pending.length;
  }
}
