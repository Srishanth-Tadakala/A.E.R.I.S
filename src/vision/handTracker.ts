/**
 * MediaPipe Tasks Vision Hand Tracker Wrapper
 * Document ID: AERIS-DOC-005
 * Extracts 21 3D landmarks in VIDEO mode with single-point horizontal camera mirroring.
 */

import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarkResult } from './types';
import { Landmark3D } from '../gestures/types';

export class HandTracker {
  private landmarker: HandLandmarker | null = null;
  private isInitializing: boolean = false;
  private isReady: boolean = false;

  async initialize(): Promise<void> {
    if (this.isReady || this.isInitializing) return;
    this.isInitializing = true;

    try {
      // Resolve WebAssembly binaries using official CDN with WebGL/WASM delegates
      const visionWasm = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.landmarker = await HandLandmarker.createFromOptions(visionWasm, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.60,
        minHandPresenceConfidence: 0.60,
        minTrackingConfidence: 0.60,
      });

      this.isReady = true;
    } catch (err) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', err);
      this.isReady = false;
      throw err;
    } finally {
      this.isInitializing = false;
    }
  }

  isInitialized(): boolean {
    return this.isReady && this.landmarker !== null;
  }

  detectFrame(video: HTMLVideoElement, timestampMs: number): HandLandmarkResult | null {
    if (!this.isReady || !this.landmarker || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null;
    }

    try {
      const result = this.landmarker.detectForVideo(video, timestampMs);

      if (!result.landmarks || result.landmarks.length === 0) {
        return {
          landmarks: [],
          worldLandmarks: [],
          confidence: 0,
          handedness: 'Right',
          isTrackingValid: false,
          timestampMs,
        };
      }

      // 1. Primary Hand Arbitration: Choose hand with highest score or index 0
      const primaryHandIndex = 0;
      const rawLandmarks = result.landmarks[primaryHandIndex];
      const rawWorldLandmarks = result.worldLandmarks ? result.worldLandmarks[primaryHandIndex] : [];
      const handednessStr =
        result.handedness && result.handedness[primaryHandIndex] && result.handedness[primaryHandIndex][0]
          ? (result.handedness[primaryHandIndex][0].displayName as 'Left' | 'Right')
          : 'Right';

      // 2. Single-Point Camera Mirroring:
      // Flip x so moving the physical hand to the right moves virtual cursor rightward
      const mirroredLandmarks: Landmark3D[] = rawLandmarks.map((pt) => ({
        x: 1.0 - pt.x,
        y: pt.y,
        z: pt.z,
      }));

      const worldLandmarks: Landmark3D[] = rawWorldLandmarks.map((pt) => ({
        x: -pt.x, // Mirror world x coordinate
        y: pt.y,
        z: pt.z,
      }));

      return {
        landmarks: mirroredLandmarks,
        worldLandmarks,
        confidence: 0.95, // High confidence since detected by HandLandmarker
        handedness: handednessStr,
        isTrackingValid: true,
        timestampMs,
      };
    } catch (err) {
      console.warn('Error during HandLandmarker detectForVideo:', err);
      return null;
    }
  }

  dispose(): void {
    if (this.landmarker) {
      try {
        this.landmarker.close();
      } catch (e) {
        console.warn('Error closing HandLandmarker:', e);
      }
      this.landmarker = null;
    }
    this.isReady = false;
  }
}
