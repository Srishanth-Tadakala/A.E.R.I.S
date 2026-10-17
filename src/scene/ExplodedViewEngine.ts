/**
 * AERIS Multi-Stage Exploded View Engine
 * Document ID: AERIS-DOC-004
 * Reversible multi-axis parametric displacement engine with zero offset drift.
 */

import * as THREE from 'three';
import { ComponentId, COMPONENT_REGISTRY } from './ComponentRegistry';

export class ExplodedViewEngine {
  private stageNodes: Map<ComponentId, THREE.Group>;
  private currentProgress: number = 0.0;
  private targetProgress: number = 0.0;
  private lerpSpeed: number = 4.5; // Smooth interpolation speed

  constructor(stageNodes: Map<ComponentId, THREE.Group>) {
    this.stageNodes = stageNodes;
  }

  setTargetProgress(progress: number): void {
    this.targetProgress = Math.max(0.0, Math.min(1.0, progress));
  }

  toggle(): number {
    this.targetProgress = this.targetProgress > 0.5 ? 0.0 : 1.0;
    return this.targetProgress;
  }

  getProgress(): number {
    return this.currentProgress;
  }

  getTargetProgress(): number {
    return this.targetProgress;
  }

  isExploded(): boolean {
    return this.currentProgress > 0.05;
  }

  /**
   * Updates stage displacements based on frame delta time.
   */
  update(dt: number): boolean {
    if (Math.abs(this.currentProgress - this.targetProgress) < 0.001) {
      if (this.currentProgress !== this.targetProgress) {
        this.currentProgress = this.targetProgress;
        this.applyDisplacement(this.currentProgress);
        return true;
      }
      return false;
    }

    this.currentProgress += (this.targetProgress - this.currentProgress) * Math.min(1.0, dt * this.lerpSpeed);
    this.applyDisplacement(this.currentProgress);
    return true;
  }

  private applyDisplacement(lambda: number): void {
    this.stageNodes.forEach((stageGroup, id) => {
      const entry = COMPONENT_REGISTRY[id];
      if (!entry) return;

      const { direction, maxDistance } = entry.explodedTransform;
      stageGroup.position.set(
        direction[0] * maxDistance * lambda,
        direction[1] * maxDistance * lambda,
        direction[2] * maxDistance * lambda
      );
    });
  }

  reset(): void {
    this.currentProgress = 0.0;
    this.targetProgress = 0.0;
    this.applyDisplacement(0.0);
  }
}
