# AERIS — Phased Implementation Roadmap
**Document ID:** AERIS-DOC-014  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Roadmap Overview & Critical Path

The AERIS development roadmap is organized into 15 structured phases designed to establish a verified vertical slice before building secondary inspection features.

```
+--------------------------------------------------------------------------------------------------+
|                                        CRITICAL PATH DIAGRAM                                     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
| [Phase 0-1: Planning] -> [Phase 2: Project Setup] -> [Phase 3: Procedural Engine & Registry]     |
|                                                                    |                             |
|                                                                    v                             |
|                           [Phase 4: Camera & Vision] ------------->+                             |
|                                      |                             |                             |
|                                      v                             v                             |
|                           [Phase 5: Gestures & Filter] -> [Phase 6: State Machine]               |
|                                                                    |                             |
|                                                                    v                             |
|                                                   +--------------------------------+             |
|                                                   | PHASE 7: FIRST VERTICAL SLICE  |             |
|                                                   | (Webcam -> Hand -> Pinch       |             |
|                                                   |  -> Stable 3D Rotation)        |             |
|                                                   +--------------------------------+             |
|                                                                    |                             |
|                     +----------------------------------------------+---------------+             |
|                     |                                                              |             |
|                     v                                                              v             |
|   [Phase 8: Spatial Cursor & Raycasting]                      [Phase 10: Exploded View Engine]   |
|                     |                                                              |             |
|                     v                                                              v             |
|   [Phase 9: Zoom & Spatial Depth]                             [Phase 11: HUD Telemetry & Dossier]|
|                     |                                                              |             |
|                     +----------------------------------------------+---------------+             |
|                                                                    |                             |
|                                                                    v                             |
|                                                   [Phase 12: Performance Optimization]           |
|                                                                    |                             |
|                                                                    v                             |
|                                                   [Phase 13: Automated & Real-Camera Tests]      |
|                                                                    |                             |
|                                                                    v                             |
|                                                   [Phase 14: Final Audit & Documentation]        |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Phase-by-Phase Implementation Specifications

### Phase 2: Project Setup & Foundational Infrastructure
- **Objective:** Establish the clean project scaffold, configuration, build pipeline, and test harness.
- **Prerequisites:** Workspace approval.
- **Detailed Tasks:**
  1. Initialize `package.json` with strict dependencies (`react`, `react-dom`, `three`, `@types/three`, `@mediapipe/tasks-vision`, `lucide-react`).
  2. Configure `tsconfig.json` with strict type checking (`strict: true`, `noImplicitAny: true`).
  3. Configure `vite.config.ts` and `vitest.config.ts`.
  4. Copy MediaPipe WebAssembly and task bundles to `/public/`.
- **Expected Outputs:** Working local Vite dev server, passing `npm run build` and `npm test` smoke runs.
- **Estimated Effort:** 1.5 hours.

### Phase 3: Procedural Engine & Shared Component Registry
- **Objective:** Implement the 8-stage parametric jet engine model and the Shared Component Registry.
- **Prerequisites:** Phase 2.
- **Detailed Tasks:**
  1. Define `ComponentRegistry.ts` with all 8 stages, metadata, and exploded vectors.
  2. Build `ProceduralEngine.ts` using parametric Three.js geometries and instanced blade rings.
  3. Create `EngineMaterials.ts` implementing CAD Wireframe and PBR Metallic palettes.
  4. Build `EngineScene.tsx` with standard Three.js render loop, camera framing, and lighting.
- **Acceptance Criteria:** Engine renders in browser at steady 60 FPS in $<20$ draw calls. Mouse drag orbits model cleanly.
- **Estimated Effort:** 4.0 hours.

### Phase 4: Camera Lifecycle & Hand Tracking
- **Objective:** Implement camera permissions, stream acquisition, and MediaPipe Tasks Vision tracking.
- **Prerequisites:** Phase 2.
- **Detailed Tasks:**
  1. Implement `cameraService.ts` with explicit user toggle and teardown handlers.
  2. Implement `handTracker.ts` wrapping `@mediapipe/tasks-vision` `HandLandmarker`.
  3. Add tracking-loss and camera-denial error handlers.
- **Acceptance Criteria:** User clicks "Engage Vision", webcam LED lights up, raw 21 landmarks stream at $\ge 30$ FPS.
- **Estimated Effort:** 3.0 hours.

### Phase 5: Gesture Features & Stabilization
- **Objective:** Extract scale-invariant features and implement One-Euro jitter filtering.
- **Prerequisites:** Phase 4.
- **Detailed Tasks:**
  1. Build `gestureFeatures.ts` calculating $d_{\text{palm}}$, $r_{\text{pinch}}$, finger flex angles, and palm normal.
  2. Build `oneEuroFilter.ts` for coordinate smoothing.
  3. Implement `gestureRecognizer.ts` with hysteresis thresholding ($0.22 / 0.35$) and 3-frame debounce.
- **Acceptance Criteria:** Unit tests pass with synthetic landmark fixtures; static hand displays zero visible coordinate jitter.
- **Estimated Effort:** 3.5 hours.

### Phase 6: Interaction State Machine & Action Dispatcher
- **Objective:** Implement the formal 9-state FSM and decoupled action dispatcher.
- **Prerequisites:** Phase 5.
- **Detailed Tasks:**
  1. Build `interactionStateMachine.ts` with strict transition matrix and anchor invalidation.
  2. Build `actionDispatcher.ts` translating state updates into Three.js transform commands.
  3. Add unit test suite asserting 100% of state transitions.
- **Acceptance Criteria:** FSM safely handles frame dropouts, clamps velocities to zero, and resets anchors upon re-entry.
- **Estimated Effort:** 2.5 hours.

### Phase 7: First End-to-End Vertical Slice (CRITICAL MILESTONE)
- **Objective:** Connect Camera $\to$ MediaPipe $\to$ Pinch Classifier $\to$ FSM $\to$ Stable 3D Engine Rotation.
- **Prerequisites:** Phases 3, 4, 5, 6.
- **Detailed Tasks:**
  1. Wire `actionDispatcher` rotation payloads to `EngineScene` model quaternion.
  2. Mount live camera PIP preview showing landmark skeleton.
  3. Test physical pinch-and-drag rotation using real webcam feed.
  4. Verify tracking loss freezes rotation without snapping.
- **Definition of Done:** User pinches in camera frame, rotates hand, and the 3D jet engine rotates smoothly in real time. Releasing the pinch stops rotation; removing the hand freezes rotation cleanly.
- **Estimated Effort:** 3.0 hours.

### Phases 8–10: Secondary Spatial Interactions
- **Phase 8 (Targeting & Raycasting):** Pointing gesture projects spatial reticle; raycasts onto engine stages; highlights hovered stage. (3.0 hrs)
- **Phase 9 (Spatial Zoom):** Pinch-spread distance or $Z$-depth dollies camera distance with strict min/max clamping. (2.0 hrs)
- **Phase 10 (Exploded View Engine):** Open palm gesture or HUD button triggers smooth axial displacement of stages. (2.5 hrs)

### Phases 11–14: UI Polish, Optimization, Testing & Final Review
- **Phase 11 (Aerospace HUD & Dossier):** Build monospace telemetry strip, component inspection dossier, and theme toggle. (3.5 hrs)
- **Phase 12 (Performance Profiling):** Profile draw calls, zero-allocation loops, and memory snapshots. (2.5 hrs)
- **Phase 13 (Automated & Empirical Testing):** Complete full Vitest suite; execute real-camera evaluation protocol. (3.0 hrs)
- **Phase 14 (Final Engineering Audit & Docs):** Verify all links, update documentation, conduct comprehensive architectural review. (2.0 hrs)

---

## 3. Total Project Effort & Parallelization Summary

- **Total Estimated Engineering Effort:** ~34.0 engineering hours.
- **Parallelizable Workstreams:**
  - *Stream A (Graphics & Scene):* Phase 3 (Procedural Engine) $\to$ Phase 10 (Exploded View).
  - *Stream B (Vision & Gestures):* Phase 4 (Vision) $\to$ Phase 5 (Gestures) $\to$ Phase 6 (State Machine).
- **Convergence Point:** Phase 7 (Vertical Slice Integration).
