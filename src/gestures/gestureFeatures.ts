/**
 * Biomechanical Feature Extraction
 * Document ID: AERIS-DOC-006
 * Pure mathematical functions converting 21 3D landmarks into scale-invariant features.
 */

import { Landmark3D, BiomechanicalFeatures, FingerCurlState } from './types';

function distance3D(a: Landmark3D, b: Landmark3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function dot3D(ax: number, ay: number, az: number, bx: number, by: number, bz: number): number {
  return ax * bx + ay * by + az * bz;
}

function normalize3D(x: number, y: number, z: number): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len < 1e-6) return [0, 0, 1];
  return [x / len, y / len, z / len];
}

/**
 * Evaluates whether an individual finger is extended based on joint vectors and wrist distance.
 */
function isFingerExtended(
  mcp: Landmark3D,
  pip: Landmark3D,
  tip: Landmark3D,
  wrist: Landmark3D,
  isThumb: boolean = false
): boolean {
  if (isThumb) {
    // Thumb anatomy moves obliquely; compare tip-to-pinky base vs mcp-to-pinky base
    const distTipToPinky = distance3D(tip, mcp);
    const distMcpToWrist = distance3D(mcp, wrist);
    return distTipToPinky > distMcpToWrist * 0.75;
  }

  // Vector from MCP to PIP
  const v1x = pip.x - mcp.x;
  const v1y = pip.y - mcp.y;
  const v1z = pip.z - mcp.z;

  // Vector from PIP to TIP
  const v2x = tip.x - pip.x;
  const v2y = tip.y - pip.y;
  const v2z = tip.z - pip.z;

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y + v1z * v1z);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y + v2z * v2z);

  if (len1 < 1e-6 || len2 < 1e-6) return false;

  const cosTheta = dot3D(v1x, v1y, v1z, v2x, v2y, v2z) / (len1 * len2);
  const tipToWrist = distance3D(tip, wrist);
  const pipToWrist = distance3D(pip, wrist);

  // Extended if aligned (cosTheta > 0.6) and tip is further from wrist than PIP joint
  return cosTheta > 0.6 && tipToWrist > pipToWrist;
}

export function extractBiomechanicalFeatures(
  landmarks: Landmark3D[],
  confidence: number = 1.0
): BiomechanicalFeatures {
  if (landmarks.length < 21) {
    throw new Error(`Invalid landmark array length: expected 21, got ${landmarks.length}`);
  }

  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexTip = landmarks[8];
  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleTip = landmarks[12];
  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringTip = landmarks[16];
  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyTip = landmarks[20];

  // 1. Anatomical scale baseline: distance from wrist to middle MCP
  const palmScale = Math.max(distance3D(wrist, middleMcp), 1e-4);

  // 2. Scale-invariant pinch separation ratio
  const pinchDistance = distance3D(thumbTip, indexTip);
  const pinchRatio = pinchDistance / palmScale;

  // 3. Digit extension states
  const fingerExtensions: FingerCurlState = {
    thumb: isFingerExtended(landmarks[2], landmarks[3], thumbTip, wrist, true),
    index: isFingerExtended(indexMcp, indexPip, indexTip, wrist),
    middle: isFingerExtended(middleMcp, middlePip, middleTip, wrist),
    ring: isFingerExtended(ringMcp, ringPip, ringTip, wrist),
    pinky: isFingerExtended(pinkyMcp, pinkyPip, pinkyTip, wrist),
  };

  // 4. Palm plane normal vector: cross product (IndexMCP - Wrist) x (PinkyMCP - Wrist)
  const v1x = indexMcp.x - wrist.x;
  const v1y = indexMcp.y - wrist.y;
  const v1z = indexMcp.z - wrist.z;

  const v2x = pinkyMcp.x - wrist.x;
  const v2y = pinkyMcp.y - wrist.y;
  const v2z = pinkyMcp.z - wrist.z;

  const crossX = v1y * v2z - v1z * v2y;
  const crossY = v1z * v2x - v1x * v2z;
  const crossZ = v1x * v2y - v1y * v2x;

  const palmNormal = normalize3D(crossX, crossY, crossZ);

  // 5. Palm centroid
  const centroid: [number, number, number] = [
    (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5.0,
    (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5.0,
    (wrist.z + indexMcp.z + middleMcp.z + ringMcp.z + pinkyMcp.z) / 5.0,
  ];

  return {
    palmScale,
    pinchRatio,
    fingerExtensions,
    palmNormal,
    centroid,
    confidence,
  };
}
