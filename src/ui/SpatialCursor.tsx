/**
 * AERIS Spatial Targeting Cursor Reticle
 * Document ID: AERIS-DOC-007, AERIS-DOC-009
 * High-contrast 2D aerospace targeting reticle rendered in screen space during pointing mode.
 */

import React from 'react';

export interface SpatialCursorProps {
  isVisible: boolean;
  screenX: number;
  screenY: number;
  isLockedOnTarget: boolean;
  hoveredComponentName?: string | null;
}

export const SpatialCursor: React.FC<SpatialCursorProps> = ({
  isVisible,
  screenX,
  screenY,
  isLockedOnTarget,
  hoveredComponentName,
}) => {
  if (!isVisible) return null;

  const accentColor = isLockedOnTarget ? 'var(--aeris-accent-amber)' : 'var(--aeris-accent-cyan)';

  return (
    <div
      style={{
        position: 'fixed',
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 50,
        transition: 'transform 0.05s ease-out',
      }}
    >
      {/* Outer Reticle Ring */}
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ display: 'block' }}>
        <circle
          cx="24"
          cy="24"
          r="18"
          fill="none"
          stroke={accentColor}
          strokeWidth="1.5"
          strokeDasharray={isLockedOnTarget ? '4 2' : 'none'}
          opacity={0.8}
        />
        {/* Center Crosshairs */}
        <line x1="24" y1="10" x2="24" y2="17" stroke={accentColor} strokeWidth="1.5" />
        <line x1="24" y1="31" x2="24" y2="38" stroke={accentColor} strokeWidth="1.5" />
        <line x1="10" y1="24" x2="17" y2="24" stroke={accentColor} strokeWidth="1.5" />
        <line x1="31" y1="24" x2="38" y2="24" stroke={accentColor} strokeWidth="1.5" />
        <circle cx="24" cy="24" r="2" fill={accentColor} />
      </svg>

      {/* Target Subsystem Label */}
      {hoveredComponentName && (
        <div
          className="font-mono"
          style={{
            position: 'absolute',
            left: '32px',
            top: '-8px',
            background: 'rgba(7, 8, 10, 0.85)',
            border: `1px solid ${accentColor}`,
            padding: '2px 6px',
            borderRadius: '2px',
            fontSize: '10px',
            whiteSpace: 'nowrap',
            color: accentColor,
            letterSpacing: '0.05em',
          }}
        >
          TARGET: {hoveredComponentName}
        </div>
      )}
    </div>
  );
};
