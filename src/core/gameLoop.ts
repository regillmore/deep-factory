export type UpdateFn = (fixedDtSeconds: number) => void;
export type RenderFn = (alpha: number, frameDtMs: number) => void;

export class GameLoop {
  private running = false;
  private lastTime = 0;
  private accumulator = 0;

  constructor(
    private fixedDt = 1000 / 60,
    private update: UpdateFn,
    private render: RenderFn
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((now) => this.frame(now));
  }

  private frame(now: number): void {
    if (!this.running) return;
    const frameDt = Math.min(100, now - this.lastTime);
    this.lastTime = now;
    this.accumulator += frameDt;

    while (this.accumulator >= this.fixedDt) {
      this.update(this.fixedDt / 1000);
      this.accumulator -= this.fixedDt;
    }

    this.render(this.accumulator / this.fixedDt, frameDt);
    requestAnimationFrame((next) => this.frame(next));
  }
}
