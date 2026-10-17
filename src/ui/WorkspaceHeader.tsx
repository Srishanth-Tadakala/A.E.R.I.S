/**
 * AERIS Workspace Header Component
 * Document ID: AERIS-DOC-009
 */

import React from 'react';
import { Camera, CameraOff, RotateCcw, Layers, Eye, HelpCircle } from 'lucide-react';
import { CameraStatus } from '../vision/types';
import { RenderMode } from '../scene/EngineMaterials';

export interface WorkspaceHeaderProps {
  cameraStatus: CameraStatus;
  renderMode: RenderMode;
  isExploded: boolean;
  onToggleCamera: () => void;
  onToggleRenderMode: () => void;
  onToggleExplode: () => void;
  onResetView: () => void;
  onOpenHelp: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  cameraStatus,
  renderMode,
  isExploded,
  onToggleCamera,
  onToggleRenderMode,
  onToggleExplode,
  onResetView,
  onOpenHelp,
}) => {
  const isStreaming = cameraStatus === 'STREAMING';
  const isCameraBusy = cameraStatus === 'REQUESTING';

  return (
    <header className="aeris-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="status-dot status-dot-active" />
          <span style={{ fontWeight: 700, letterSpacing: '0.08em', fontSize: '13px' }}>
            AERIS <span style={{ color: 'var(--aeris-accent-amber)' }}>//</span> SPATIAL ENGINE WORKSPACE
          </span>
        </div>
        <span
          className="font-mono"
          style={{
            fontSize: '10px',
            color: 'var(--aeris-text-muted)',
            borderLeft: '1px solid var(--aeris-border-subtle)',
            paddingLeft: '10px',
          }}
        >
          TURBOFAN ASSEMBLY [PARAMETRIC CAD]
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Camera Toggle Button */}
        <button
          className={`aeris-btn ${isStreaming ? 'aeris-btn-primary' : ''}`}
          onClick={onToggleCamera}
          disabled={isCameraBusy}
          title={isStreaming ? 'Disengage Camera' : 'Engage Camera Tracking'}
        >
          {isStreaming ? <Camera size={14} /> : <CameraOff size={14} />}
          <span>{isStreaming ? 'VISION: ACTIVE' : isCameraBusy ? 'ENGAGING...' : 'ENGAGE VISION'}</span>
        </button>

        {/* Explode View Toggle */}
        <button
          className={`aeris-btn ${isExploded ? 'aeris-btn-active' : ''}`}
          onClick={onToggleExplode}
          title="Toggle Axial Exploded View (Key: E)"
        >
          <Layers size={14} />
          <span>{isExploded ? 'COLLAPSE [E]' : 'EXPLODE [E]'}</span>
        </button>

        {/* Render Mode Toggle */}
        <button
          className="aeris-btn"
          onClick={onToggleRenderMode}
          title="Toggle CAD Wireframe vs PBR Metallic (Key: M)"
        >
          <Eye size={14} />
          <span>{renderMode === 'CAD_WIREFRAME' ? 'MODE: CAD [M]' : 'MODE: PBR [M]'}</span>
        </button>

        {/* Reset View Button */}
        <button className="aeris-btn" onClick={onResetView} title="Reset Model Orientation (Key: R)">
          <RotateCcw size={14} />
          <span>RESET [R]</span>
        </button>

        {/* Help Button */}
        <button className="aeris-btn" onClick={onOpenHelp} title="Gesture Quick Reference Guide">
          <HelpCircle size={14} />
        </button>
      </div>
    </header>
  );
};
