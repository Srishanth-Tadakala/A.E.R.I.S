/**
 * AERIS Camera Service
 * Document ID: AERIS-DOC-005
 * Manages explicit WebRTC camera lifecycle, stream acquisition, and hardware track teardown.
 */

import { CameraStatus } from './types';

export type CameraStatusListener = (status: CameraStatus, error?: Error) => void;

export class CameraService {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private status: CameraStatus = 'INACTIVE';
  private listeners: Set<CameraStatusListener> = new Set();

  constructor() {
    this.createVideoElement();
  }

  private createVideoElement(): void {
    if (typeof document !== 'undefined') {
      this.videoElement = document.createElement('video');
      this.videoElement.autoplay = true;
      this.videoElement.playsInline = true;
      this.videoElement.muted = true;
      this.videoElement.style.display = 'none';
    }
  }

  getStatus(): CameraStatus {
    return this.status;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  subscribe(listener: CameraStatusListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: CameraStatus, error?: Error): void {
    this.status = status;
    this.listeners.forEach((l) => l(status, error));
  }

  async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream> {
    if (this.status === 'STREAMING' && this.stream) {
      return this.stream;
    }

    this.setStatus('REQUESTING');

    const defaultConstraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 640, min: 480 },
        height: { ideal: 480, min: 360 },
        frameRate: { ideal: 60, min: 30 },
        facingMode: 'user',
      },
      audio: false, // Strict audio disable
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC getUserMedia API is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints || defaultConstraints);
      this.stream = stream;

      if (!this.videoElement) {
        this.createVideoElement();
      }

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        await new Promise<void>((resolve) => {
          if (!this.videoElement) return resolve();
          this.videoElement.onloadedmetadata = () => {
            this.videoElement?.play().then(() => resolve()).catch(() => resolve());
          };
        });
      }

      this.setStatus('STREAMING');
      return stream;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.setStatus('PERMISSION_DENIED', error);
      } else {
        this.setStatus('ERROR', error);
      }
      throw error;
    }
  }

  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop(); // Hardware LED off immediately
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }

    this.setStatus('STOPPED');
  }
}
