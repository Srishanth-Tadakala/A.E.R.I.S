/**
 * Deterministic Gesture Pose Recognition
 * Document ID: AERIS-DOC-006
 * Rule-based heuristic classifier operating on normalized biomechanical features.
 */

import { BiomechanicalFeatures, GestureType } from './types';

export interface GestureThresholds {
  pinchEnterRatio: number;
  pinchExitRatio: number;
}

export const DEFAULT_GESTURE_THRESHOLDS: GestureThresholds = {
  pinchEnterRatio: 0.22,
  pinchExitRatio: 0.35,
};

export class GestureRecognizer {
  private thresholds: GestureThresholds;
  private isCurrentlyPinching: boolean = false;

  constructor(thresholds: GestureThresholds = DEFAULT_GESTURE_THRESHOLDS) {
    this.thresholds = thresholds;
  }

  setThresholds(thresholds: Partial<GestureThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getThresholds(): GestureThresholds {
    return { ...this.thresholds };
  }

  /**
   * Classifies a candidate gesture from biomechanical features using hysteresis for pinch.
   */
  classifyPose(features: BiomechanicalFeatures): GestureType {
    const { pinchRatio, fingerExtensions, palmNormal } = features;

    // 1. Evaluate Pinch with Dual-Threshold Hysteresis
    if (this.isCurrentlyPinching) {
      if (pinchRatio >= this.thresholds.pinchExitRatio) {
        this.isCurrentlyPinching = false;
      }
    } else {
      if (pinchRatio <= this.thresholds.pinchEnterRatio) {
        this.isCurrentlyPinching = true;
      }
    }

    if (this.isCurrentlyPinching) {
      return 'PINCH_ACTIVE';
    }

    // 2. Evaluate Pointing Gesture: Index extended, Middle/Ring/Pinky curled
    if (
      fingerExtensions.index &&
      !fingerExtensions.middle &&
      !fingerExtensions.ring &&
      !fingerExtensions.pinky
    ) {
      return 'POINT';
    }

    // 3. Evaluate Open Palm: All 5 fingers extended, palm normal facing user/camera
    if (
      fingerExtensions.thumb &&
      fingerExtensions.index &&
      fingerExtensions.middle &&
      fingerExtensions.ring &&
      fingerExtensions.pinky &&
      Math.abs(palmNormal[2]) > 0.3
    ) {
      return 'OPEN_PALM';
    }

    // 4. Evaluate Fist: All 5 fingers curled
    if (
      !fingerExtensions.index &&
      !fingerExtensions.middle &&
      !fingerExtensions.ring &&
      !fingerExtensions.pinky
    ) {
      return 'FIST';
    }

    return 'NEUTRAL';
  }

  reset(): void {
    this.isCurrentlyPinching = false;
  }
}
