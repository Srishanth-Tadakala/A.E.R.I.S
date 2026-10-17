/**
 * Unit Tests: Biomechanical Features & Gesture Recognition
 * Document ID: AERIS-DOC-011
 */

import { describe, it, expect } from 'vitest';
import { extractBiomechanicalFeatures } from '../../src/gestures/gestureFeatures';
import { GestureRecognizer } from '../../src/gestures/gestureRecognizer';
import {
  createBaseHand,
  createPinchHand,
  createPointingHand,
  createFistHand,
} from '../fixtures/landmarkFixtures';

describe('Biomechanical Feature Extraction', () => {
  it('extracts scale-invariant palm metric and pinch ratio', () => {
    const hand1 = createPinchHand(1.0);
    const hand2 = createPinchHand(2.0); // Hand twice as large / closer to camera

    const feat1 = extractBiomechanicalFeatures(hand1);
    const feat2 = extractBiomechanicalFeatures(hand2);

    expect(feat1.palmScale).toBeGreaterThan(0);
    expect(feat2.palmScale).toBeCloseTo(feat1.palmScale * 2.0, 2);

    // Scale-invariant pinch ratio must remain virtually identical
    expect(feat1.pinchRatio).toBeCloseTo(feat2.pinchRatio, 2);
    expect(feat1.pinchRatio).toBeLessThan(0.15); // Clear pinch
  });

  it('correctly calculates finger extension flags on open palm', () => {
    const openHand = createBaseHand(1.0);
    const features = extractBiomechanicalFeatures(openHand);

    expect(features.fingerExtensions.index).toBe(true);
    expect(features.fingerExtensions.middle).toBe(true);
    expect(features.fingerExtensions.ring).toBe(true);
    expect(features.fingerExtensions.pinky).toBe(true);
  });

  it('detects curled fingers on a pointing hand', () => {
    const pointHand = createPointingHand(1.0);
    const features = extractBiomechanicalFeatures(pointHand);

    expect(features.fingerExtensions.index).toBe(true);
    expect(features.fingerExtensions.middle).toBe(false);
    expect(features.fingerExtensions.ring).toBe(false);
    expect(features.fingerExtensions.pinky).toBe(false);
  });
});

describe('Gesture Recognizer & Hysteresis Thresholding', () => {
  it('classifies PINCH_ACTIVE and enforces hysteresis band', () => {
    const recognizer = new GestureRecognizer({
      pinchEnterRatio: 0.22,
      pinchExitRatio: 0.35,
    });

    // 1. Initial neutral hand
    const neutralHand = createBaseHand(1.0);
    const neutralFeat = extractBiomechanicalFeatures(neutralHand);
    expect(recognizer.classifyPose(neutralFeat)).not.toBe('PINCH_ACTIVE');

    // 2. Pinching hand (ratio < 0.22)
    const pinchHand = createPinchHand(1.0);
    const pinchFeat = extractBiomechanicalFeatures(pinchHand);
    expect(recognizer.classifyPose(pinchFeat)).toBe('PINCH_ACTIVE');

    // 3. Hand moves to dead-band ratio (e.g. 0.28) -> Must maintain PINCH_ACTIVE
    const deadbandFeat = { ...pinchFeat, pinchRatio: 0.28 };
    expect(recognizer.classifyPose(deadbandFeat)).toBe('PINCH_ACTIVE');

    // 4. Hand moves beyond exit ratio (0.38) -> Must release pinch
    const releasedFeat = { ...pinchFeat, pinchRatio: 0.38 };
    expect(recognizer.classifyPose(releasedFeat)).not.toBe('PINCH_ACTIVE');
  });

  it('classifies POINT gesture when only index finger is extended', () => {
    const recognizer = new GestureRecognizer();
    const pointHand = createPointingHand(1.0);
    const feat = extractBiomechanicalFeatures(pointHand);

    expect(recognizer.classifyPose(feat)).toBe('POINT');
  });

  it('classifies FIST gesture when all fingers are curled', () => {
    const recognizer = new GestureRecognizer();
    const fistHand = createFistHand(1.0);
    const feat = extractBiomechanicalFeatures(fistHand);

    expect(recognizer.classifyPose(feat)).toBe('FIST');
  });
});
