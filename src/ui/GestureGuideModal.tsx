/**
 * AERIS Gesture & Fallback Quick Reference Guide Modal
 * Document ID: AERIS-DOC-009
 */

import React from 'react';
import { X, Hand, Mouse, Keyboard } from 'lucide-react';

export interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(7, 8, 10, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="aeris-panel"
        style={{ width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aeris-panel-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
            <Hand size={14} color="var(--aeris-accent-amber)" />
            AERIS // SPATIAL & FALLBACK INTERACTION SPECIFICATION
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--aeris-text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Spatial Hand Gestures */}
          <div>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aeris-accent-amber)', letterSpacing: '0.05em' }}>
              NATURAL HAND GESTURES (WEBCAM)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div style={{ background: 'var(--aeris-bg-surface-elevated)', padding: '10px', borderRadius: '4px' }}>
                <div className="font-mono" style={{ fontWeight: 600, fontSize: '11px', color: '#fff' }}>
                  PINCH & DRAG
                </div>
                <div style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)', marginTop: '4px' }}>
                  Touch thumb and index fingertips together. Move hand to rotate the 3D turbofan smoothly.
                </div>
              </div>

              <div style={{ background: 'var(--aeris-bg-surface-elevated)', padding: '10px', borderRadius: '4px' }}>
                <div className="font-mono" style={{ fontWeight: 600, fontSize: '11px', color: '#fff' }}>
                  POINTING RAY
                </div>
                <div style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)', marginTop: '4px' }}>
                  Extend index finger with other fingers curled. Aim reticle to highlight engine stages.
                </div>
              </div>

              <div style={{ background: 'var(--aeris-bg-surface-elevated)', padding: '10px', borderRadius: '4px' }}>
                <div className="font-mono" style={{ fontWeight: 600, fontSize: '11px', color: '#fff' }}>
                  PINCH ON TARGET
                </div>
                <div style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)', marginTop: '4px' }}>
                  Pinch while targeting an engine stage to lock selection and open the aerospace dossier.
                </div>
              </div>

              <div style={{ background: 'var(--aeris-bg-surface-elevated)', padding: '10px', borderRadius: '4px' }}>
                <div className="font-mono" style={{ fontWeight: 600, fontSize: '11px', color: '#fff' }}>
                  OPEN PALM
                </div>
                <div style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)', marginTop: '4px' }}>
                  Extend all 5 fingers with palm facing camera to trigger multi-axis exploded view expansion.
                </div>
              </div>
            </div>
          </div>

          {/* Mouse & Keyboard Fallback Parity */}
          <div style={{ borderTop: '1px solid var(--aeris-border-subtle)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--aeris-accent-cyan)', letterSpacing: '0.05em' }}>
              PRECISION MOUSE & KEYBOARD FALLBACK CONTROLS
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mouse size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Left Click & Drag:</strong> Orbit rotate scene
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mouse size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Scroll Wheel:</strong> Continuous zoom in/out
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Key [R]:</strong> Reset view & rotation
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Key [E]:</strong> Toggle exploded view
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Key [M]:</strong> Toggle CAD vs PBR Mode
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Keyboard size={14} color="var(--aeris-text-muted)" />
                <span style={{ fontSize: '11px', color: 'var(--aeris-text-secondary)' }}>
                  <strong style={{ color: '#fff' }}>Key [C]:</strong> Engage / Stop camera vision
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
