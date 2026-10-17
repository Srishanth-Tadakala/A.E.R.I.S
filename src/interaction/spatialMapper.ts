/**
 * Spatial Coordinate Mapping & Normalization
 * Document ID: AERIS-DOC-007
 * Converts coordinates between Mirrored Normalized Image Space, Screen Space, and Three.js NDC.
 */

export interface ViewportDimensions {
  width: number;
  height: number;
  left: number;
  top: number;
}

export class SpatialMapper {
  /**
   * Converts a normalized mirrored coordinate [0, 1] to Three.js Normalized Device Coordinates (NDC) [-1, 1].
   * In NDC, center is (0, 0), top is +1, bottom is -1, left is -1, right is +1.
   */
  static normalizedToNDC(normX: number, normY: number): [number, number] {
    const ndcX = normX * 2.0 - 1.0;
    const ndcY = 1.0 - normY * 2.0; // Invert Y for WebGL
    return [
      Math.max(-1.0, Math.min(1.0, ndcX)),
      Math.max(-1.0, Math.min(1.0, ndcY)),
    ];
  }

  /**
   * Converts a normalized mirrored coordinate [0, 1] to Canvas Screen Coordinates (px).
   */
  static normalizedToScreen(
    normX: number,
    normY: number,
    viewport: ViewportDimensions
  ): [number, number] {
    const screenX = viewport.left + normX * viewport.width;
    const screenY = viewport.top + normY * viewport.height;
    return [screenX, screenY];
  }

  /**
   * Calculates movement delta with velocity clamping to prevent sudden coordinate jumps.
   */
  static calculateClampedDelta(
    currentX: number,
    currentY: number,
    prevX: number,
    prevY: number,
    maxDelta: number = 0.15
  ): [number, number] {
    const rawDx = currentX - prevX;
    const rawDy = currentY - prevY;

    const clampedDx = Math.max(-maxDelta, Math.min(maxDelta, rawDx));
    const clampedDy = Math.max(-maxDelta, Math.min(maxDelta, rawDy));

    return [clampedDx, clampedDy];
  }
}
