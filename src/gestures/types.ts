/**
 * Gesture Recognition & Biomechanical Types
 * Document ID: AERIS-DOC-006
 */

export interface Landmark3D {
  x: number;
  y: number;
  z: number;
}

export type GestureType =
  | 'PINCH_START'
  | 'PINCH_ACTIVE'
  | 'PINCH_MOVE'
  | 'PINCH_RELEASE'
  | 'POINT'
  | 'OPEN_PALM'
  | 'FIST'
  | 'NEUTRAL'
  | 'TRACKING_LOST';

export interface FingerCurlState {
  thumb: boolean;  // true if extended, false if curled
  index: boolean;
  middle: boolean;
  ring: boolean;
  pinky: boolean;
}

export interface BiomechanicalFeatures {
  /** Anatomical reference scale ||P9 - P0|| */
  palmScale: number;
  /** Scale-invariant separation ||P4 - P8|| / palmScale */
  pinchRatio: number;
  /** Extension boolean flags for each digit */
  fingerExtensions: FingerCurlState;
  /** Normalized 3D normal vector of the palm plane */
  palmNormal: [number, number, number];
  /** Palm centroid (mirrored image space) [x, y, z] */
  centroid: [number, number, number];
  /** Hand detection confidence score */
  confidence: number;
}

export interface FilteredLandmarksResult {
  landmarks: Landmark3D[];
  features: BiomechanicalFeatures;
  timestampMs: number;
  isValid: boolean;
}
