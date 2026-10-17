/**
 * Unit Tests: Component Registry & Hierarchy Crawler
 * Document ID: AERIS-DOC-011
 */

import { describe, it, expect } from 'vitest';
import {
  COMPONENT_REGISTRY,
  ComponentId,
  resolveComponentFromObject,
} from '../../src/scene/ComponentRegistry';

describe('Shared Component Registry', () => {
  const expectedStages: ComponentId[] = [
    'intake_spinner',
    'fan_blades',
    'lpc_booster',
    'hpc_core',
    'combustor',
    'hpt_turbine',
    'lpt_turbine',
    'exhaust_nozzle',
    'outer_casing',
  ];

  it('contains entries for all 9 defined assemblies', () => {
    expectedStages.forEach((id) => {
      const entry = COMPONENT_REGISTRY[id];
      expect(entry).toBeDefined();
      expect(entry.id).toBe(id);
      expect(entry.metadata.displayName).toBeTruthy();
      expect(entry.metadata.specifications.operatingRpm).toBeTruthy();
      expect(entry.metadata.specifications.temperatureRange).toBeTruthy();
      expect(entry.metadata.specifications.materialAlloy).toBeTruthy();
      expect(entry.explodedTransform.direction).toHaveLength(3);
    });
  });

  it('correctly crawls object hierarchy to resolve parent ComponentId', () => {
    // Simulate nested Three.js Object3D parent hierarchy:
    // Root -> StageGroup (with userData.componentId) -> ChildMesh -> LeafSubmesh
    const stageGroup = {
      userData: { componentId: 'fan_blades' },
      parent: null,
    };
    const childMesh = {
      userData: {},
      parent: stageGroup,
    };
    const leafSubmesh = {
      userData: {},
      parent: childMesh,
    };

    expect(resolveComponentFromObject(leafSubmesh)).toBe('fan_blades');
    expect(resolveComponentFromObject(childMesh)).toBe('fan_blades');
    expect(resolveComponentFromObject(stageGroup)).toBe('fan_blades');
    expect(resolveComponentFromObject({ userData: {}, parent: null })).toBeNull();
  });
});
