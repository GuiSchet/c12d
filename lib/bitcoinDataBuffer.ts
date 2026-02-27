/**
 * A fixed-size rolling buffer. Pushes to the end and evicts from the front
 * once maxSize is exceeded.
 */
export class RollingBuffer<T> {
  private buffer: T[] = [];

  constructor(private readonly maxSize: number) {}

  push(item: T): void {
    this.buffer.push(item);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  get(): T[] {
    return [...this.buffer];
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
  }
}
