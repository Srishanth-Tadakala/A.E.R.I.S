/**
 * Synthetic Hand Landmark Test Fixtures
 * Document ID: AERIS-DOC-011
 * Deterministic mathematical 3D coordinate fixtures for testing feature extraction,
 * gesture classification, and scale invariance.
 */

import { Landmark3D } from '../../src/gestures/types';

export function createBaseHand(scale: number = 1.0, isMirrored: boolean = false): Landmark3D[] {
  // Canonical neutral open hand centered at wrist (0, 0, 0)
  const pts: [number, number, number][] = [
    [0.5, 0.8, 0.0],   // 0: Wrist
    [0.45, 0.72, 0.0], // 1: Thumb CMC
    [0.42, 0.65, 0.0], // 2: Thumb MCP
    [0.39, 0.58, 0.0], // 3: Thumb IP
    [0.36, 0.52, 0.0], // 4: Thumb Tip
    [0.47, 0.60, 0.0], // 5: Index MCP
    [0.47, 0.50, 0.0], // 6: Index PIP
    [0.47, 0.42, 0.0], // 7: Index DIP
    [0.47, 0.35, 0.0], // 8: Index Tip
    [0.50, 0.59, 0.0], // 9: Middle MCP
    [0.50, 0.48, 0.0], // 10: Middle PIP
    [0.50, 0.39, 0.0], // 11: Middle DIP
    [0.50, 0.32, 0.0], // 12: Middle Tip
    [0.53, 0.60, 0.0], // 13: Ring MCP
    [0.53, 0.50, 0.0], // 14: Ring PIP
    [0.53, 0.43, 0.0], // 15: Ring DIP
    [0.53, 0.36, 0.0], // 16: Ring Tip
    [0.56, 0.62, 0.0], // 17: Pinky MCP
    [0.56, 0.54, 0.0], // 18: Pinky PIP
    [0.56, 0.48, 0.0], // 19: Pinky DIP
    [0.56, 0.42, 0.0], // 20: Pinky Tip
  ];

  const wristX = pts[0][0];
  const wristY = pts[0][1];

  return pts.map(([x, y, z]) => {
    // Scale relative to wrist
    const sx = wristX + (x - wristX) * scale;
    const sy = wristY + (y - wristY) * scale;
    const sz = z * scale;
    return {
      x: isMirrored ? 1.0 - sx : sx,
      y: sy,
      z: sz,
    };
  });
}

export function createPinchHand(scale: number = 1.0): Landmark3D[] {
  const hand = createBaseHand(scale);
  // Bring index tip (8) and thumb tip (4) into touching contact
  const touchX = (hand[4].x + hand[8].x) / 2;
  const touchY = (hand[4].y + hand[8].y) / 2;
  hand[4] = { x: touchX, y: touchY, z: 0 };
  hand[8] = { x: touchX + 0.005 * scale, y: touchY, z: 0 };
  return hand;
}

export function createPointingHand(scale: number = 1.0): Landmark3D[] {
  const hand = createBaseHand(scale);
  // Curl middle, ring, pinky, and thumb towards palm
  hand[12] = { x: hand[9].x, y: hand[9].y + 0.05, z: 0.05 }; // Middle tip curled down
  hand[16] = { x: hand[13].x, y: hand[13].y + 0.05, z: 0.05 }; // Ring tip curled down
  hand[20] = { x: hand[17].x, y: hand[17].y + 0.05, z: 0.05 }; // Pinky tip curled down
  hand[4] = { x: hand[2].x, y: hand[2].y, z: 0.02 }; // Thumb folded
  return hand;
}

export function createFistHand(scale: number = 1.0): Landmark3D[] {
  const hand = createBaseHand(scale);
  // Curl all 5 fingers
  hand[8] = { x: hand[5].x, y: hand[5].y + 0.04, z: 0.05 };
  hand[12] = { x: hand[9].x, y: hand[9].y + 0.04, z: 0.05 };
  hand[16] = { x: hand[13].x, y: hand[13].y + 0.04, z: 0.05 };
  hand[20] = { x: hand[17].x, y: hand[17].y + 0.04, z: 0.05 };
  hand[4] = { x: hand[2].x, y: hand[2].y + 0.02, z: 0.05 };
  return hand;
}
