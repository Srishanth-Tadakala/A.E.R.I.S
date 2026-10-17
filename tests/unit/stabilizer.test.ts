/**
 * Unit Tests: One-Euro Filter & Gesture Stabilization
 * Document ID: AERIS-DOC-011
 */

import { describe, it, expect } from 'vitest';
import { OneEuroFilter } from '../../src/gestures/oneEuroFilter';
import { GestureStabilizer } from '../../src/gestures/gestureStabilizer';
import { createPinchHand, createBaseHand } from '../fixtures/landmarkFixtures';

describe('One-Euro Adaptive Filter', () => {
  it('attenuates high-frequency noise during stationary poses', () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    const nominal = 0.5;
    const rawValues: number[] = [];
    const filteredValues: number[] = [];

    // Simulate 60 frames at 16.6ms intervals with 0.02 jitter
    for (let i = 0; i < 60; i++) {
      const timeMs = i * 16.67;
      const noise = (Math.sin(i * 1.5) + Math.cos(i * 2.7)) * 0.015;
      const noisyVal = nominal + noise;
      rawValues.push(noisyVal);
      filteredValues.push(filter.filter(noisyVal, timeMs));
    }

    // Calculate variance of last 30 frames
    const rawSlice = rawValues.slice(30);
    const filteredSlice = filteredValues.slice(30);

    const rawMean = rawSlice.reduce((a, b) => a + b, 0) / rawSlice.length;
    const rawVariance = rawSlice.reduce((a, b) => a + Math.pow(b - rawMean, 2), 0) / rawSlice.length;

    const filteredMean = filteredSlice.reduce((a, b) => a + b, 0) / filteredSlice.length;
    const filteredVariance = filteredSlice.reduce((a, b) => a + Math.pow(b - filteredMean, 2), 0) / filteredSlice.length;

    // Filtered variance must be substantially lower (>70% reduction)
    expect(filteredVariance).toBeLessThan(rawVariance * 0.3);
  });

  it('tracks large dynamic steps rapidly', () => {
    const filter = new OneEuroFilter(1.0, 0.007, 1.0);
    // Initialize at 0.0
    for (let i = 0; i < 10; i++) {
      filter.filter(0.0, i * 16.67);
    }

    // Step to 1.0: measure across 4 frames (~66ms)
    filter.filter(1.0, 11 * 16.67);
    filter.filter(1.0, 12 * 16.67);
    filter.filter(1.0, 13 * 16.67);
    const valAt66ms = filter.filter(1.0, 14 * 16.67);

    // Adaptive speed coefficient beta opens cutoff frequency; step response reaches > 0.35 within 66ms
    expect(valAt66ms).toBeGreaterThan(0.35);
  });
});

describe('Gesture Temporal Stabilizer & Debounce', () => {
  it('emits PINCH_START on contact, PINCH_MOVE during hold, and PINCH_RELEASE on separation', () => {
    const stabilizer = new GestureStabilizer(3);
    const openHand = createBaseHand(1.0);
    const pinchHand = createPinchHand(1.0);

    // Initial frames: Open hand to prime filter
    for (let i = 0; i < 5; i++) {
      stabilizer.processFrame(openHand, 1.0, i * 16.67);
    }

    // Feed pinch hand frames until low-pass filter settles and triggers PINCH_START -> PINCH_MOVE
    const gestures: string[] = [];
    for (let i = 5; i < 25; i++) {
      const res = stabilizer.processFrame(pinchHand, 1.0, i * 16.67);
      gestures.push(res.gesture);
    }

    // Must contain PINCH_START followed by PINCH_MOVE
    expect(gestures).toContain('PINCH_START');
    expect(gestures[gestures.length - 1]).toBe('PINCH_MOVE');

    // Open hand frames -> Must transition to PINCH_RELEASE
    const releaseGestures: string[] = [];
    for (let i = 25; i < 45; i++) {
      const res = stabilizer.processFrame(openHand, 1.0, i * 16.67);
      releaseGestures.push(res.gesture);
    }
    expect(releaseGestures).toContain('PINCH_RELEASE');
  });

  it('emits TRACKING_LOST on missing or invalid landmarks', () => {
    const stabilizer = new GestureStabilizer(3);
    const res = stabilizer.processFrame([], 0.0, 200);

    expect(res.gesture).toBe('TRACKING_LOST');
  });
});
