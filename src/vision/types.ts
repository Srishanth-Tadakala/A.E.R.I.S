/**
 * Camera & Vision Pipeline Types
 * Document ID: AERIS-DOC-005
 */

import { Landmark3D } from '../gestures/types';

export type CameraStatus =
  | 'INACTIVE'
  | 'REQUESTING'
  | 'STREAMING'
  | 'PERMISSION_DENIED'
  | 'ERROR'
  | 'STOPPED';

export interface HandLandmarkResult {
  landmarks: Landmark3D[];
  worldLandmarks: Landmark3D[];
  confidence: number;
  handedness: 'Left' | 'Right';
  isTrackingValid: boolean;
  timestampMs: number;
}
