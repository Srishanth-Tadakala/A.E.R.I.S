/**
 * AERIS Component Inspection Dossier
 * Document ID: AERIS-DOC-003, AERIS-DOC-009
 * Contextual side drawer displaying aerospace engineering specifications for selected components.
 */

import React from 'react';
import { X, Cpu, Thermometer, Gauge, Shield, Layers } from 'lucide-react';
import { ComponentId, COMPONENT_REGISTRY } from '../scene/ComponentRegistry';

export interface ComponentDossierProps {
  selectedId: ComponentId | null;
  onClose: () => void;
}

export const ComponentDossier: React.FC<ComponentDossierProps> = ({ selectedId, onClose }) => {
  if (!selectedId) return null;

  const entry = COMPONENT_REGISTRY[selectedId];
  if (!entry) return null;

  const { metadata } = entry;
  const { specifications } = metadata;

  return (
    <div
      className="aeris-panel"
      style={{
        position: 'absolute',
        top: '64px',
        right: '16px',
        width: '320px',
        maxHeight: 'calc(100vh - 120px)',
        zIndex: 30,
        overflowY: 'auto',
      }}
    >
      <div className="aeris-panel-header">
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={12} color="var(--aeris-accent-cyan)" />
          SUBSYSTEM DOSSIER
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--aeris-text-muted)',
            cursor: 'pointer',
            padding: '2px',
          }}
          title="Close Dossier"
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Title and Category */}
        <div>
          <span
            className="font-mono"
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--aeris-accent-amber)',
            }}
          >
            {metadata.category}
          </span>
          <h2 style={{ fontSize: '15px', fontWeight: 600, marginTop: '2px', color: '#fff' }}>
            {metadata.displayName}
          </h2>
        </div>

        {/* Technical Description */}
        <p style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--aeris-text-secondary)' }}>
          {metadata.description}
        </p>

        {/* Engineering Specifications Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '8px',
            borderTop: '1px solid var(--aeris-border-subtle)',
            paddingTop: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Gauge size={14} color="var(--aeris-accent-cyan)" style={{ marginTop: '2px' }} />
            <div>
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--aeris-text-muted)' }}>
                OPERATING ROTATION
              </div>
              <div className="font-mono" style={{ fontSize: '12px', fontWeight: 500 }}>
                {specifications.operatingRpm}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Thermometer size={14} color="var(--aeris-accent-amber)" style={{ marginTop: '2px' }} />
            <div>
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--aeris-text-muted)' }}>
                TEMPERATURE RANGE
              </div>
              <div className="font-mono" style={{ fontSize: '12px', fontWeight: 500 }}>
                {specifications.temperatureRange}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Layers size={14} color="var(--aeris-accent-cyan)" style={{ marginTop: '2px' }} />
            <div>
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--aeris-text-muted)' }}>
                PRESSURE RATIO
              </div>
              <div className="font-mono" style={{ fontSize: '12px', fontWeight: 500 }}>
                {specifications.compressionOrExpansionRatio}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Shield size={14} color="#a78bfa" style={{ marginTop: '2px' }} />
            <div>
              <div className="font-mono" style={{ fontSize: '10px', color: 'var(--aeris-text-muted)' }}>
                MATERIAL COMPOSITION
              </div>
              <div className="font-mono" style={{ fontSize: '12px', fontWeight: 500 }}>
                {specifications.materialAlloy}
              </div>
            </div>
          </div>
        </div>

        {/* Provenance Disclaimer */}
        <div
          style={{
            fontSize: '10px',
            color: 'var(--aeris-text-muted)',
            background: 'var(--aeris-bg-surface-elevated)',
            padding: '6px 8px',
            borderRadius: '4px',
            borderLeft: '2px solid var(--aeris-accent-amber)',
          }}
        >
          {metadata.provenance}
        </div>
      </div>
    </div>
  );
};
