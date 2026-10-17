/**
 * Gesture Temporal Stabilizer & Debounce Pipeline
 * Document ID: AERIS-DOC-006
 * Coordinates filtering, temporal hysteresis, and edge event generation.
 */

import { Landmark3D, BiomechanicalFeatures, GestureType } from './types';
import { OneEuroFilter3D } from './oneEuroFilter';
import { extractBiomechanicalFeatures } from './gestureFeatures';
import { GestureRecognizer, DEFAULT_GESTURE_THRESHOLDS } from './gestureRecognizer';

export interface StabilizedGestureOutput {
  gesture: GestureType;
  rawPose: GestureType;
  smoothedCentroid: [number, number, number];
  features: BiomechanicalFeatures;
  filteredLandmarks: Landmark3D[];
  confidence: number;
  timestampMs: number;
}

export class GestureStabilizer {
  private recognizer: GestureRecognizer;
  private landmarkFilters: OneEuroFilter3D[] = [];
  private debounceThreshold: number = 3;
  private candidatePose: GestureType = 'NEUTRAL';
  private candidateFrames: number = 0;
  private confirmedPose: GestureType = 'NEUTRAL';
  private wasPinching: boolean = false;

  constructor(debounceThreshold: number = 3) {
    this.debounceThreshold = debounceThreshold;
    this.recognizer = new GestureRecognizer(DEFAULT_GESTURE_THRESHOLDS);
    this.initFilters();
  }

  private initFilters(): void {
    this.landmarkFilters = [];
    for (let i = 0; i < 21; i++) {
      this.landmarkFilters.push(new OneEuroFilter3D(1.0, 0.007, 1.0));
    }
  }

  /**
   * Processes a new frame of raw landmarks.
   */
  processFrame(
    rawLandmarks: Landmark3D[],
    confidence: number,
    timestampMs: number
  ): StabilizedGestureOutput {
    if (!rawLandmarks || rawLandmarks.length < 21 || confidence < 0.5) {
      this.reset();
      return {
        gesture: 'TRACKING_LOST',
        rawPose: 'TRACKING_LOST',
        smoothedCentroid: [0, 0, 0],
        features: {
          palmScale: 1,
          pinchRatio: 1,
          fingerExtensions: { thumb: false, index: false, middle: false, ring: false, pinky: false },
          palmNormal: [0, 0, 1],
          centroid: [0, 0, 0],
          confidence: 0,
        },
        filteredLandmarks: [],
        confidence: 0,
        timestampMs,
      };
    }

    // 1. Smooth landmarks with One-Euro Filter
    const filteredLandmarks: Landmark3D[] = rawLandmarks.map((pt, i) => {
      const [fx, fy, fz] = this.landmarkFilters[i].filter(pt.x, pt.y, pt.z, timestampMs);
      return { x: fx, y: fy, z: fz };
    });

    // 2. Extract biomechanical features
    const features = extractBiomechanicalFeatures(filteredLandmarks, confidence);

    // 3. Classify raw pose with hysteresis
    const rawPose = this.recognizer.classifyPose(features);

    // 4. Temporal Debouncing for discrete poses
    if (rawPose === this.candidatePose) {
      this.candidateFrames++;
    } else {
      this.candidatePose = rawPose;
      this.candidateFrames = 1;
    }

    if (this.candidateFrames >= this.debounceThreshold) {
      this.confirmedPose = this.candidatePose;
    }

    // 5. Generate continuous vs discrete gesture events
    let emittedGesture: GestureType = this.confirmedPose;

    const isPinchNow = rawPose === 'PINCH_ACTIVE';
    if (isPinchNow && !this.wasPinching) {
      emittedGesture = 'PINCH_START';
      this.wasPinching = true;
    } else if (isPinchNow && this.wasPinching) {
      emittedGesture = 'PINCH_MOVE';
    } else if (!isPinchNow && this.wasPinching) {
      emittedGesture = 'PINCH_RELEASE';
      this.wasPinching = false;
    }

    return {
      gesture: emittedGesture,
      rawPose,
      smoothedCentroid: features.centroid,
      features,
      filteredLandmarks,
      confidence,
      timestampMs,
    };
  }

  reset(): void {
    this.landmarkFilters.forEach((f) => f.reset());
    this.recognizer.reset();
    this.candidatePose = 'NEUTRAL';
    this.candidateFrames = 0;
    this.confirmedPose = 'NEUTRAL';
    this.wasPinching = false;
  }
}
