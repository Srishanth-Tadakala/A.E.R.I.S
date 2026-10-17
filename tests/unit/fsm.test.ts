/**
 * Unit Tests: Interaction State Machine
 * Document ID: AERIS-DOC-011
 */

import { describe, it, expect, vi } from 'vitest';
import { InteractionStateMachine } from '../../src/interaction/interactionStateMachine';

describe('Interaction State Machine (FSM)', () => {
  it('follows expected lifecycle from IDLE to MANIPULATING and back', () => {
    const fsm = new InteractionStateMachine();
    expect(fsm.getState()).toBe('IDLE');

    // Hand detected
    fsm.send({ type: 'HAND_DETECTED' });
    expect(fsm.getState()).toBe('TRACKING');

    // Pinch initiated
    fsm.send({ type: 'PINCH_START', centroid: [0.5, 0.5, 0] });
    expect(fsm.getState()).toBe('MANIPULATING_ROTATION');
    expect(fsm.isAnchorValid()).toBe(true);
    expect(fsm.getAnchor()).toEqual([0.5, 0.5]);

    // Pinch released
    fsm.send({ type: 'PINCH_RELEASE' });
    expect(fsm.getState()).toBe('TRACKING');
    expect(fsm.getAnchor()).toBeNull();
  });

  it('safely handles tracking loss during manipulation without jump discontinuities', () => {
    const fsm = new InteractionStateMachine();
    fsm.send({ type: 'HAND_DETECTED' });
    fsm.send({ type: 'PINCH_START', centroid: [0.4, 0.6, 0] });
    expect(fsm.getState()).toBe('MANIPULATING_ROTATION');

    // Hand suddenly leaves camera frame
    fsm.send({ type: 'TRACKING_DROPPED' });
    expect(fsm.getState()).toBe('TRACKING_LOST');
    expect(fsm.isAnchorValid()).toBe(false);

    // Hand re-enters frame
    fsm.send({ type: 'HAND_REACQUIRED' });
    expect(fsm.getState()).toBe('RECOVERY');
    expect(fsm.isAnchorValid()).toBe(false); // Anchor must still be invalid

    // First frame tick in recovery: re-seeds anchor
    fsm.send({ type: 'FRAME_TICK', gesture: 'NEUTRAL', centroid: [0.8, 0.2, 0] });
    expect(fsm.getState()).toBe('TRACKING');
    expect(fsm.isAnchorValid()).toBe(true);
    expect(fsm.getAnchor()).toEqual([0.8, 0.2]); // Re-seeded without producing delta from [0.4, 0.6]
  });

  it('resets to IDLE on RESET_TRIGGERED from any active state', () => {
    const fsm = new InteractionStateMachine();
    fsm.send({ type: 'HAND_DETECTED' });
    fsm.send({ type: 'PINCH_START', centroid: [0.5, 0.5, 0] });
    expect(fsm.getState()).toBe('MANIPULATING_ROTATION');

    fsm.send({ type: 'RESET_TRIGGERED' });
    expect(fsm.getState()).toBe('IDLE');
    expect(fsm.isAnchorValid()).toBe(false);
  });

  it('notifies subscribers on state transitions', () => {
    const fsm = new InteractionStateMachine();
    const listener = vi.fn();
    fsm.subscribe(listener);

    fsm.send({ type: 'HAND_DETECTED' });
    expect(listener).toHaveBeenCalledWith('TRACKING', 'IDLE', { type: 'HAND_DETECTED' });
  });
});
