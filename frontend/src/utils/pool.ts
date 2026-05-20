export class Pool<T> {
  private pool: T[] = [];
  private readonly factory: () => T;
  private readonly reset: (item: T) => void;
  private totalAllocated = 0;

  constructor(factory: () => T, reset: (item: T) => void, initialSize = 64) {
    this.factory = factory;
    this.reset = reset;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
      this.totalAllocated++;
    }
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    this.totalAllocated++;
    return this.factory();
  }

  release(item: T): void {
    this.reset(item);
    this.pool.push(item);
  }

  get size(): number {
    return this.pool.length;
  }

  get allocated(): number {
    return this.totalAllocated;
  }

  clear(): void {
    this.pool.length = 0;
  }
}
