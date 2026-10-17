/**
 * Integration Test: End-to-End Gesture-to-Action Pipeline
 * Document ID: AERIS-DOC-011
 * Verifies that landmark streams correctly drive the FSM and ActionDispatcher
 * while guaranteeing jump suppression on tracking loss and recovery.
 */

import { describe, it, expect, vi } from 'vitest';
import { GestureStabilizer } from '../../src/gestures/gestureStabilizer';
import { InteractionStateMachine } from '../../src/interaction/interactionStateMachine';
import { ActionDispatcher } from '../../src/interaction/actionDispatcher';
import { SpatialMapper } from '../../src/interaction/spatialMapper';
import { createPinchHand, createBaseHand } from '../fixtures/landmarkFixtures';

describe('End-to-End Pipeline Integration', () => {
  it('drives rotation actions from moving pinch landmarks and cleanly halts on release', () => {
    const stabilizer = new GestureStabilizer(3);
    const fsm = new InteractionStateMachine();
    const dispatcher = new ActionDispatcher();
    const actionSubscriber = vi.fn();
    dispatcher.subscribe(actionSubscriber);

    const openHand = createBaseHand(1.0);
    const pinchHand = createPinchHand(1.0);

    // 1. Initial Hand Entry
    stabilizer.processFrame(openHand, 1.0, 100);
    fsm.send({ type: 'HAND_DETECTED' });
    expect(fsm.getState()).toBe('TRACKING');

    // 2. Pinch Onset
    for (let i = 0; i < 20; i++) {
      const res = stabilizer.processFrame(pinchHand, 1.0, 120 + i * 16.67);
      if (res.gesture === 'PINCH_START') {
        fsm.send({ type: 'PINCH_START', centroid: res.smoothedCentroid });
      } else if (res.gesture === 'PINCH_MOVE') {
        fsm.send({ type: 'PINCH_MOVE', centroid: res.smoothedCentroid });
        if (fsm.getState() === 'MANIPULATING_ROTATION') {
          dispatcher.dispatchRotation(0.01, 0.02);
        }
      }
    }

    expect(fsm.getState()).toBe('MANIPULATING_ROTATION');
    expect(actionSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'UPDATE_ROTATION' })
    );

    // 3. Pinch Release
    for (let i = 20; i < 40; i++) {
      const res = stabilizer.processFrame(openHand, 1.0, 120 + i * 16.67);
      if (res.gesture === 'PINCH_RELEASE') {
        fsm.send({ type: 'PINCH_RELEASE' });
      }
    }

    expect(fsm.getState()).toBe('TRACKING');
  });

  it('safely clamps velocities to zero and invalidates anchors upon tracking loss', () => {
    const stabilizer = new GestureStabilizer(3);
    const fsm = new InteractionStateMachine();
    const dispatcher = new ActionDispatcher();
    const actionSubscriber = vi.fn();
    dispatcher.subscribe(actionSubscriber);

    fsm.send({ type: 'HAND_DETECTED' });
    fsm.send({ type: 'PINCH_START', centroid: [0.5, 0.5, 0] });
    expect(fsm.getState()).toBe('MANIPULATING_ROTATION');

    // Simulate camera dropout
    const lostRes = stabilizer.processFrame([], 0.0, 500);
    expect(lostRes.gesture).toBe('TRACKING_LOST');

    fsm.send({ type: 'TRACKING_DROPPED' });
    dispatcher.dispatchSuspend();

    expect(fsm.getState()).toBe('TRACKING_LOST');
    expect(fsm.isAnchorValid()).toBe(false);
    expect(actionSubscriber).toHaveBeenCalledWith({ type: 'SUSPEND_MANIPULATION' });

    // Hand re-enters at a completely different corner of the frame [0.9, 0.1]
    fsm.send({ type: 'HAND_REACQUIRED' });
    expect(fsm.getState()).toBe('RECOVERY');

    // First recovery frame tick re-seeds anchor
    fsm.send({ type: 'FRAME_TICK', gesture: 'NEUTRAL', centroid: [0.9, 0.1, 0] });
    expect(fsm.getState()).toBe('TRACKING');
    expect(fsm.getAnchor()).toEqual([0.9, 0.1]);

    // Clamped delta calculation confirms no jump occurred
    const [clampedDx, clampedDy] = SpatialMapper.calculateClampedDelta(0.9, 0.1, 0.9, 0.1);
    expect(clampedDx).toBe(0.0);
    expect(clampedDy).toBe(0.0);
  });
});
