# AERIS — Performance Engineering & Resource Optimization Plan
**Document ID:** AERIS-DOC-010  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Performance Target Objectives

All values listed below are **engineering design targets** for mainstream desktop and laptop hardware (e.g. Intel Iris Xe, Apple Silicon M1+, AMD Radeon 600M, or discrete GPUs) on Chrome/Edge/Firefox. They must be validated through empirical measurement during implementation.

| Metric | Target Objective | Acceptable Threshold | Measurement Methodology |
|---|---|---|---|
| **Render Frame Rate** | $\ge 60 \text{ FPS}$ | $\ge 45 \text{ FPS}$ (under high load) | Moving average of `requestAnimationFrame` delta times ($1/dt$). |
| **CV Inference Duration** | $\le 18 \text{ ms}$ | $\le 28 \text{ ms}$ | Timestamp delta across `handLandmarker.detectForVideo()`. |
| **Spatial Interaction Latency** | $\le 33 \text{ ms}$ ($\le 2$ frames) | $\le 50 \text{ ms}$ | Delta between camera frame arrival and Three.js scene transform application. |
| **Procedural Initialization Time** | $\le 250 \text{ ms}$ | $\le 500 \text{ ms}$ | `performance.now()` across geometry generation and scene graph construction. |
| **Draw Call Count** | $\le 25$ calls per frame | $\le 40$ calls per frame | `renderer.info.render.calls` query per render pass. |
| **Total Triangles** | $\le 45,000$ triangles | $\le 80,000$ triangles | `renderer.info.render.triangles` query. |
| **Geometry Memory Footprint** | $\le 25 \text{ MB}$ | $\le 45 \text{ MB}$ | `renderer.info.memory.geometries` & Chrome DevTools Memory Snapshot. |
| **GC Hot-Path Allocations** | **Zero heap allocations** | $< 1 \text{ KB}$ per frame | Chrome DevTools Allocation Profiler during active drag. |

---

## 2. Hot-Path Optimization Rules

### 2.1 Zero-Allocation Spatial Vector Math
Creating new `THREE.Vector3`, `THREE.Quaternion`, or temporary arrays inside the 60 FPS animation loop or the 30 FPS vision callback triggers frequent Garbage Collection (GC) pauses, causing noticeable stutter.

**Engineering Enforcement:**
All vector, matrix, and quaternion math in `actionDispatcher.ts` and `EngineScene.tsx` must utilize statically pre-allocated scratch objects:

```typescript
// Statically allocated module-level scratchpad
const _scratchVecA = new THREE.Vector3();
const _scratchVecB = new THREE.Vector3();
const _scratchQuatA = new THREE.Quaternion();
const _scratchQuatB = new THREE.Quaternion();
const _scratchMatrix = new THREE.Matrix4();

export function applyRotationDelta(targetMesh: THREE.Object3D, deltaX: number, deltaY: number, sensitivity: number) {
  _scratchQuatA.setFromAxisAngle(THREE.Vector3.UP, deltaX * sensitivity);
  _scratchQuatB.setFromAxisAngle(THREE.Vector3.RIGHT, deltaY * sensitivity);
  _scratchQuatA.multiply(_scratchQuatB);
  
  targetMesh.quaternion.premultiply(_scratchQuatA);
}
```

### 2.2 Device Pixel Ratio (DPR) Clamping
High-DPI displays (Retina, 4K laptops) with DPR 3.0+ cause severe fragment fill-rate bottlenecks when rendering complex overlapping transparent CAD geometry.
AERIS clamps DPR:
```typescript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
```

### 2.3 Transparent Mesh Sorting & Depth Writes
CAD wireframes and transparent casings can trigger expensive depth sorting:
- Opaque turbine cores are rendered first with `depthWrite: true`.
- Transparent outer nacelles are rendered second with `depthWrite: false` and `transparent: true`.
- Minimizes overdraw penalties on integrated GPUs.

---

## 3. Profiling & Measurement Strategy

Empirical verification will be conducted using:
1. **In-App Real-Time Diagnostics:** Monospace HUD panel reading `renderer.info.render.calls`, `renderer.info.render.triangles`, and calculated moving average FPS.
2. **Chrome Performance Profiling:** Trace recordings analyzing main-thread execution budgets to verify MediaPipe inference leaves $\ge 50\%$ frame budget for browser composition and rendering.
3. **Memory Leak Audit:** Simulating 50 consecutive camera start/stop cycles and 50 model reset cycles, asserting that heap memory returns to baseline without detached DOM nodes or un-disposed WebGL buffers.
