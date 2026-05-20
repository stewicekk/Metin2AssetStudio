export class RendererProfiler {
  private marks = new Map<string, number[]>();
  private frameTimes: number[] = [];
  private maxFrameTime = 0;
  private frameCount = 0;
  private frameStart = 0;
  private lastMark = 0;
  private currentMarks: Record<string, number> = {};
  private readonly maxFrames = 120;

  beginFrame(): void {
    this.frameCount++;
    this.frameStart = performance.now();
    this.lastMark = this.frameStart;
    this.currentMarks = {};
  }

  mark(name: string): void {
    const now = performance.now();
    const duration = now - this.lastMark;
    this.currentMarks[name] = (this.currentMarks[name] || 0) + duration;
    this.lastMark = now;
  }

  endFrame(): { fps: number; marks: Record<string, number> } {
    const frameDuration = performance.now() - this.frameStart;
    this.frameTimes.push(frameDuration);
    if (this.frameTimes.length > this.maxFrames) this.frameTimes.shift();
    if (frameDuration > this.maxFrameTime) this.maxFrameTime = frameDuration;

    for (const [name, duration] of Object.entries(this.currentMarks)) {
      let arr = this.marks.get(name);
      if (!arr) {
        arr = [];
        this.marks.set(name, arr);
      }
      arr.push(duration);
      if (arr.length > this.maxFrames) arr.shift();
    }

    const totalTime = this.frameTimes.reduce((a, b) => a + b, 0);
    const avgFrameTime = this.frameTimes.length > 0 ? totalTime / this.frameTimes.length : 0;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;

    const marks: Record<string, number> = {};
    for (const [name, arr] of this.marks) {
      const sum = arr.reduce((a, b) => a + b, 0);
      marks[name] = arr.length > 0 ? sum / arr.length : 0;
    }

    return { fps: Math.round(fps), marks };
  }

  getStats(): { avgFrameTime: number; maxFrameTime: number; bottlenecks: string[] } {
    const totalTime = this.frameTimes.reduce((a, b) => a + b, 0);
    const avgFrameTime = this.frameTimes.length > 0 ? totalTime / this.frameTimes.length : 0;
    const bottlenecks: string[] = [];
    for (const [name, arr] of this.marks) {
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      if (avg > avgFrameTime * 0.3) bottlenecks.push(name);
    }
    return { avgFrameTime, maxFrameTime: this.maxFrameTime, bottlenecks };
  }

  getMarks(): Record<string, number> {
    const marks: Record<string, number> = {};
    for (const [name, arr] of this.marks) {
      const sum = arr.reduce((a, b) => a + b, 0);
      marks[name] = arr.length > 0 ? sum / arr.length : 0;
    }
    return marks;
  }

  reset(): void {
    this.marks.clear();
    this.frameTimes = [];
    this.maxFrameTime = 0;
    this.frameCount = 0;
    this.currentMarks = {};
  }
}
