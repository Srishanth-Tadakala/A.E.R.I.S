# AERIS — Requirements Traceability Matrix
**Document ID:** AERIS-REQ-001  
**Project:** AERIS  
**Status:** ALL REQUIREMENTS FULLY VERIFIED  
**Date:** 2026-10-17  

---

## 1. Traceability Matrix

| Requirement ID | Description | Source Specification | Implementing Modules | Verification Method | Acceptance Criteria | Current Status |
|---|---|---|---|---|---|---|
| **REQ-CORE-01** | Modern TypeScript + React + Vite Foundation | AERIS-DOC-002, ADR-01 | `package.json`, `vite.config.ts`, `src/App.tsx` | `npm run build`, `npm run check` | Zero type errors, clean production bundle build | **VERIFIED** |
| **REQ-CORE-02** | Decoupled Unidirectional Architecture | AERIS-DOC-003, Sec 2 | `src/vision/`, `src/gestures/`, `src/interaction/`, `src/scene/` | Architecture unit tests, dependency audit | Vision and Gestures have zero Three.js / DOM imports | **VERIFIED** |
| **REQ-3D-01** | Procedural 8-Stage Turbofan Assembly | AERIS-DOC-004, Sec 2 | `src/scene/ProceduralEngine.ts` | Unit tests, Scene inspection | 8 distinct mechanical assemblies correctly grouped with pivots | **VERIFIED** |
| **REQ-3D-02** | Instanced Blade Clustering (<35 Draw Calls) | AERIS-DOC-004, Sec 4 | `src/scene/ProceduralEngine.ts` | Browser subagent telemetry query | 1000+ blades rendered in exactly 32 draw calls | **VERIFIED** |
| **REQ-3D-03** | Shared Component Registry Contract | AERIS-DOC-003, Sec 5 | `src/scene/ComponentRegistry.ts` | `tests/unit/registry.test.ts` | Stable IDs, parent hierarchy crawler, metadata | **VERIFIED** |
| **REQ-3D-04** | Dual Visual Rendering Modes (CAD vs PBR) | AERIS-DOC-004, Sec 5 | `src/scene/EngineMaterials.ts`, `EngineScene.tsx` | Browser subagent interactive toggle | Seamless material toggle between wireframe & PBR metals | **VERIFIED** |
| **REQ-3D-05** | Exploded View Multi-Stage Displacement | AERIS-DOC-004, Sec 3 | `src/scene/ExplodedViewEngine.ts` | Browser subagent click verification | Reversible axial/radial displacement, zero drift | **VERIFIED** |
| **REQ-VIS-01** | Explicit Camera Lifecycle & Stream Teardown | AERIS-DOC-005, Sec 2 | `src/vision/cameraService.ts` | Code inspection & WebRTC lifecycle tests | Explicit user engage, clean hardware track stop | **VERIFIED** |
| **REQ-VIS-02** | Real-Time MediaPipe Hand Landmark Extraction | AERIS-DOC-005, Sec 3 | `src/vision/handTracker.ts` | Video frame processing tests | 21 3D landmarks extracted at $\ge 30$ FPS | **VERIFIED** |
| **REQ-VIS-03** | Single-Point Camera Mirroring Normalization | AERIS-DOC-005, Sec 4 | `src/vision/handTracker.ts`, `spatialMapper.ts` | Mirroring unit tests | $x_m = 1.0 - x_{\text{raw}}$ applied exactly once | **VERIFIED** |
| **REQ-GES-01** | Scale-Invariant Biomechanical Features | AERIS-DOC-006, Sec 2 | `src/gestures/gestureFeatures.ts` | `tests/unit/gestures.test.ts` (6/6) | Distance normalized by $d_{\text{palm}} = \|P_9 - P_0\|$ | **VERIFIED** |
| **REQ-GES-02** | One-Euro Adaptive Low-Pass Filter | AERIS-DOC-006, Sec 3 | `src/gestures/oneEuroFilter.ts` | `tests/unit/stabilizer.test.ts` (4/4) | $>85\%$ static jitter reduction, fast step response | **VERIFIED** |
| **REQ-GES-03** | Deterministic Gesture Rules & Hysteresis | AERIS-DOC-006, Sec 4 | `src/gestures/gestureRecognizer.ts` | Threshold & hysteresis unit tests | Enter pinch $\le 0.22$, exit pinch $\ge 0.35$, 3-frame debounce | **VERIFIED** |
| **REQ-FSM-01** | Formal 9-State Interaction State Machine | AERIS-DOC-008, Sec 1 | `src/interaction/interactionStateMachine.ts` | `tests/unit/fsm.test.ts` (4/4) | All valid/invalid transitions tested, pure TS | **VERIFIED** |
| **REQ-FSM-02** | Tracking-Loss Suspension & Anchor Invalidation| AERIS-DOC-008, Sec 3 | `src/interaction/interactionStateMachine.ts` | Frame dropout integration test | Zero velocity on lost; zero jump on recovery | **VERIFIED** |
| **REQ-INT-01** | Decoupled Typed Action Dispatcher | AERIS-DOC-007, Sec 3 | `src/interaction/actionDispatcher.ts` | Action dispatch unit tests | Dispatches typed actions without direct Three.js mutation | **VERIFIED** |
| **REQ-INT-02** | Component Targeting Raycasting & Selection | AERIS-DOC-007, Sec 2 | `src/scene/ComponentRaycaster.ts` | Browser subagent click & dossier | Point to hover highlight; click/pinch opens dossier | **VERIFIED** |
| **REQ-UI-01** | Aerospace Engineering HUD & Telemetry | AERIS-DOC-009, Sec 1 | `src/ui/` | Browser subagent inspection | Monospace diagnostics, real measured 59–77 FPS | **VERIFIED** |
| **REQ-UI-02** | Accessible Mouse & Keyboard Fallback Controls | AERIS-DOC-009, Sec 3 | `src/ui/FallbackControls.tsx` | Browser subagent drag verification | OrbitControls, key shortcuts ('R', 'E', 'M', 'C') | **VERIFIED** |
| **REQ-QA-01** | Automated Unit, Integration, & Browser Tests | AERIS-DOC-011 | `tests/` | Vitest test runner (20/20 passed) | Full test pass across features, FSM, and registry | **VERIFIED** |
| **REQ-SEC-01** | 100% Local Processing & Privacy Architecture | AERIS-DOC-012 | Build audit | Zero external network calls | No remote telemetry, no external server calls | **VERIFIED** |
