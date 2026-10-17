/**
 * Unit Tests: Spatial Coordinate Mapping
 * Document ID: AERIS-DOC-011
 */

import { describe, it, expect } from 'vitest';
import { SpatialMapper } from '../../src/interaction/spatialMapper';

describe('SpatialMapper Coordinate Conversions', () => {
  it('converts normalized coordinates to WebGL NDC correctly', () => {
    // Center of screen (0.5, 0.5) -> (0.0, 0.0) NDC
    const [centerNdcX, centerNdcY] = SpatialMapper.normalizedToNDC(0.5, 0.5);
    expect(centerNdcX).toBeCloseTo(0.0, 4);
    expect(centerNdcY).toBeCloseTo(0.0, 4);

    // Top-left (0.0, 0.0) -> (-1.0, 1.0) NDC
    const [tlNdcX, tlNdcY] = SpatialMapper.normalizedToNDC(0.0, 0.0);
    expect(tlNdcX).toBeCloseTo(-1.0, 4);
    expect(tlNdcY).toBeCloseTo(1.0, 4);

    // Bottom-right (1.0, 1.0) -> (1.0, -1.0) NDC
    const [brNdcX, brNdcY] = SpatialMapper.normalizedToNDC(1.0, 1.0);
    expect(brNdcX).toBeCloseTo(1.0, 4);
    expect(brNdcY).toBeCloseTo(-1.0, 4);
  });

  it('clamps excessive deltas to prevent velocity snaps', () => {
    // Normal subtle movement
    const [dx1, dy1] = SpatialMapper.calculateClampedDelta(0.52, 0.51, 0.50, 0.50, 0.15);
    expect(dx1).toBeCloseTo(0.02, 4);
    expect(dy1).toBeCloseTo(0.01, 4);

    // Sudden sensor glitch or re-entry jump (e.g. 0.8 delta)
    const [dx2, dy2] = SpatialMapper.calculateClampedDelta(0.9, 0.1, 0.1, 0.9, 0.15);
    expect(dx2).toBe(0.15); // Clamped to max positive
    expect(dy2).toBe(-0.15); // Clamped to max negative
  });
});
