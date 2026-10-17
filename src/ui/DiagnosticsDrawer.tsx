/**
 * AERIS Real-Time Diagnostics & Telemetry Strip
 * Document ID: AERIS-DOC-009, AERIS-DOC-010
 * Displays honest, measured system performance and state telemetry.
 */

import React from 'react';
import { Activity, Cpu, Layers } from 'lucide-react';
import { InteractionState } from '../interaction/types';
import { GestureType } from '../gestures/types';
import { SceneTelemetry } from '../scene/EngineScene';

export interface DiagnosticsDrawerProps {
  interactionState: InteractionState;
  activeGesture: GestureType;
  pinchRatio: number;
  sceneTelemetry: SceneTelemetry;
  inferenceDurationMs: number;
}

export const DiagnosticsDrawer: React.FC<DiagnosticsDrawerProps> = ({
  interactionState,
  activeGesture,
  pinchRatio,
  sceneTelemetry,
  inferenceDurationMs,
}) => {
  return (
    <footer className="aeris-footer-strip font-mono">
      {/* Left: Interaction & Gesture Telemetry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={13} color="var(--aeris-accent-amber)" />
          <span>STATE:</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{interactionState}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>GESTURE:</span>
          <span style={{ color: 'var(--aeris-accent-cyan)', fontWeight: 600 }}>{activeGesture}</span>
          <span style={{ color: 'var(--aeris-text-muted)' }}>(r={pinchRatio.toFixed(2)})</span>
        </div>
      </div>

      {/* Right: Graphics & Inference Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={13} color="var(--aeris-accent-cyan)" />
          <span>CV INFERENCE:</span>
          <span style={{ color: '#fff' }}>
            {inferenceDurationMs > 0 ? `${inferenceDurationMs.toFixed(1)} ms` : 'OFFLINE'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>RENDER:</span>
          <span style={{ color: sceneTelemetry.fps >= 50 ? 'var(--aeris-accent-emerald)' : 'var(--aeris-accent-amber)' }}>
            {sceneTelemetry.fps} FPS
          </span>
          <span style={{ color: 'var(--aeris-text-muted)' }}>({sceneTelemetry.frameTimeMs}ms)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="var(--aeris-text-muted)" />
          <span>DRAWS:</span>
          <span style={{ color: '#fff' }}>{sceneTelemetry.drawCalls}</span>
          <span style={{ color: 'var(--aeris-text-muted)' }}>({(sceneTelemetry.triangles / 1000).toFixed(1)}k tris)</span>
        </div>
      </div>
    </footer>
  );
};
