/**
 * AERIS Live Vision Monitor (Picture-in-Picture)
 * Document ID: AERIS-DOC-005, AERIS-DOC-009
 * Renders live webcam stream with real-time 2D landmark skeleton overlay and gesture telemetry.
 */

import React, { useEffect, useRef } from 'react';
import { Camera, EyeOff } from 'lucide-react';
import { Landmark3D, GestureType } from '../gestures/types';
import { CameraStatus } from '../vision/types';

export interface VisionMonitorProps {
  cameraStatus: CameraStatus;
  videoElement: HTMLVideoElement | null;
  landmarks: Landmark3D[];
  activeGesture: GestureType;
  inferenceDurationMs: number;
}

// MediaPipe hand skeleton connection pairs
const SKELETON_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm transverse
  [5, 9], [9, 13], [13, 17],
];

export const VisionMonitor: React.FC<VisionMonitorProps> = ({
  cameraStatus,
  videoElement,
  landmarks,
  activeGesture,
  inferenceDurationMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw video background if streaming
    if (cameraStatus === 'STREAMING' && videoElement && videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      ctx.save();
      // Video is mirrored horizontally
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoElement, 0, 0, width, height);
      ctx.restore();

      // Semi-transparent dark overlay for high-contrast skeleton
      ctx.fillStyle = 'rgba(7, 8, 10, 0.4)';
      ctx.fillRect(0, 0, width, height);
    } else {
      // Offline background
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);
      return;
    }

    // 2. Draw Landmark Skeleton
    if (landmarks && landmarks.length >= 21) {
      // Connect joints
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.0;

      SKELETON_CONNECTIONS.forEach(([i, j]) => {
        const p1 = landmarks[i];
        const p2 = landmarks[j];
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      });

      // Draw Joint Points
      landmarks.forEach((pt, idx) => {
        const x = pt.x * width;
        const y = pt.y * height;
        const isPinchDigit = idx === 4 || idx === 8;

        ctx.beginPath();
        ctx.arc(x, y, isPinchDigit ? 4.5 : 2.5, 0, 2 * Math.PI);
        if (isPinchDigit && (activeGesture === 'PINCH_START' || activeGesture === 'PINCH_MOVE')) {
          ctx.fillStyle = '#ff7a00'; // Amber when pinching
        } else {
          ctx.fillStyle = '#ffffff';
        }
        ctx.fill();
        ctx.strokeStyle = '#07080a';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }, [cameraStatus, videoElement, landmarks, activeGesture]);

  const isStreaming = cameraStatus === 'STREAMING';

  return (
    <div
      className="aeris-panel"
      style={{
        position: 'absolute',
        bottom: '48px',
        left: '16px',
        width: '220px',
        zIndex: 30,
        overflow: 'hidden',
      }}
    >
      <div className="aeris-panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Camera size={12} color="var(--aeris-accent-amber)" />
          VISION MONITOR
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: '9px',
            color: isStreaming ? 'var(--aeris-accent-emerald)' : 'var(--aeris-accent-crimson)',
          }}
        >
          {isStreaming ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      <div style={{ position: 'relative', width: '220px', height: '165px', background: '#000' }}>
        <canvas ref={canvasRef} width={220} height={165} style={{ display: 'block', width: '100%', height: '100%' }} />

        {!isStreaming && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: 'var(--aeris-text-muted)',
              fontSize: '11px',
            }}
          >
            <EyeOff size={24} />
            <span>Camera Disengaged</span>
          </div>
        )}

        {/* HUD Overlay inside PIP */}
        {isStreaming && (
          <div
            className="font-mono"
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '6px',
              right: '6px',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '9px',
              color: 'var(--aeris-accent-cyan)',
              background: 'rgba(7, 8, 10, 0.75)',
              padding: '2px 4px',
              borderRadius: '2px',
            }}
          >
            <span>GESTURE: {activeGesture}</span>
            <span>{inferenceDurationMs.toFixed(1)}ms</span>
          </div>
        )}
      </div>
    </div>
  );
};
