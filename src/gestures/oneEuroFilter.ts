/**
 * One-Euro (1€) Adaptive Low-Pass Filter
 * Document ID: AERIS-DOC-006
 * Casiez, Roussel, Vogel (CHI 2012)
 * Eliminates high-frequency static coordinate trembling while preserving responsiveness during rapid motion.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.y === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = alpha * value + (1.0 - alpha) * this.s!;
    this.s = this.y;
    return this.y;
  }

  hasLast(): boolean {
    return this.y !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number, te: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / te);
  }

  filter(value: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(value, 1.0);
    }

    const te = Math.max((timestampMs - this.lastTime) / 1000.0, 1e-4); // dt in seconds
    this.lastTime = timestampMs;

    // Estimate filtered derivative (velocity)
    const dx = this.xFilter.hasLast() ? (value - this.xFilter.last()) / te : 0.0;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, te));

    // Dynamic cutoff frequency based on velocity
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    return this.xFilter.filter(value, this.alpha(cutoff, te));
  }

  reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export class OneEuroFilter3D {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private filterZ: OneEuroFilter;

  constructor(minCutoff: number = 1.0, beta: number = 0.007, dCutoff: number = 1.0) {
    this.filterX = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterY = new OneEuroFilter(minCutoff, beta, dCutoff);
    this.filterZ = new OneEuroFilter(minCutoff, beta, dCutoff);
  }

  filter(x: number, y: number, z: number, timestampMs: number): [number, number, number] {
    return [
      this.filterX.filter(x, timestampMs),
      this.filterY.filter(y, timestampMs),
      this.filterZ.filter(z, timestampMs),
    ];
  }

  reset(): void {
    this.filterX.reset();
    this.filterY.reset();
    this.filterZ.reset();
  }
}
