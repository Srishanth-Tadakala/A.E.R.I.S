# AERIS — Module Implementation Plan & Repository Structure
**Document ID:** AERIS-DOC-013  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Directory Tree Specification

```
aeris/
|-- index.html                           # Single-page HTML entry point
|-- package.json                         # Dependencies & npm scripts
|-- tsconfig.json                        # Strict TypeScript 5 configuration
|-- vite.config.ts                       # Vite bundler & test configuration
|-- public/
|   |-- models/                          # MediaPipe task bundle & optional external GLBs
|   |   `-- hand_landmarker.task
|   `-- wasm/                            # MediaPipe WebAssembly binaries
|-- src/
|   |-- main.tsx                         # React application mounting
|   |-- App.tsx                          # Top-level workspace layout & state coordination
|   |-- vision/                          # Computer Vision Subsystem
|   |   |-- cameraService.ts             # WebRTC camera capture & permission lifecycle
|   |   |-- handTracker.ts               # MediaPipe Tasks Vision wrapper
|   |   `-- types.ts                     # Landmark & camera state interfaces
|   |-- gestures/                        # Gesture Intelligence & Stabilization Subsystem
|   |   |-- gestureFeatures.ts           # Scale-invariant geometric math (r_pinch, curl)
|   |   |-- oneEuroFilter.ts             # Adaptive low-pass jitter filter
|   |   |-- gestureStabilizer.ts         # Hysteresis & temporal debounce manager
|   |   |-- gestureRecognizer.ts         # Deterministic rule-based pose classifier
|   |   `-- types.ts                     # Gesture pose & feature definitions
|   |-- interaction/                     # Interaction Control & State Machine Subsystem
|   |   |-- interactionStateMachine.ts   # Formal 9-state FSM
|   |   |-- spatialMapper.ts             # Normalized image -> NDC -> Screen conversions
|   |   |-- actionDispatcher.ts          # Validates & translates states into scene actions
|   |   `-- types.ts                     # FSM events, states, & action payloads
|   |-- scene/                           # 3D Graphics & Procedural Subsystem
|   |   |-- EngineScene.tsx              # Three.js canvas container & animation loop
|   |   |-- ComponentRegistry.ts         # Shared registry contract, metadata, & offsets
|   |   |-- ProceduralEngine.ts          # Parametric 8-stage turbofan mesh generator
|   |   |-- EngineMaterials.ts           # Technical CAD wireframe & PBR material factory
|   |   |-- ComponentRaycaster.ts        # Screen-space component targeting & highlighting
|   |   `-- ExplodedViewEngine.ts        # Axial & radial multi-stage displacement controller
|   |-- ui/                              # Aerospace HUD & Diagnostics Subsystem
|   |   |-- WorkspaceHeader.tsx          # Status, mode switches, & quick actions
|   |   |-- VisionMonitor.tsx            # Live PIP webcam feed with landmark skeleton overlay
|   |   |-- ComponentDossier.tsx         # Aerospace technical specification drawer
|   |   |-- SpatialCursor.tsx            # 2D screen-space targeting reticle
|   |   |-- DiagnosticsDrawer.tsx        # Real-time FPS, latency, & memory telemetry
|   |   |-- FallbackControls.tsx         # Mouse/keyboard toolbar & reset buttons
|   |   `-- GestureGuideModal.tsx        # Gesture quick-reference overlay
|   |-- styles/
|   |   |-- tokens.css                   # Obsidian, amber, & cyan design variables
|   |   `-- workspace.css                # Layout, grid, typography, & animation styles
|   `-- tests/
|       |-- fixtures/                    # Synthetic landmark vector test suites
|       |-- unit/                        # Mathematical & state machine unit tests
|       `-- integration/                 # Action pipeline & lifecycle integration tests
`-- docs/                                # Complete engineering planning documentation
```

---

## 2. Detailed Module Specifications

### 2.1 `src/vision/cameraService.ts`
- **Responsibility:** Hardware webcam access, permission states, stream acquisition, and teardown.
- **Public Interface:**
  ```typescript
  export class CameraService {
    async startCamera(constraints?: MediaStreamConstraints): Promise<MediaStream>;
    stopCamera(): void;
    getStream(): MediaStream | null;
    getVideoElement(): HTMLVideoElement;
    onStateChange(cb: (state: CameraState) => void): () => void;
  }
  ```
- **Dependencies:** None (Browser WebRTC API).
- **Error Conditions:** Throws typed `CameraPermissionDeniedError`, `CameraNotFoundError`, or `CameraInUseError`.
- **Test File:** `tests/unit/cameraService.test.ts` (using mock `navigator.mediaDevices`).

### 2.2 `src/vision/handTracker.ts`
- **Responsibility:** Initializes MediaPipe `HandLandmarker` and processes video frames.
- **Public Interface:**
  ```typescript
  export class HandTracker {
    async initialize(wasmPath: string, modelPath: string): Promise<void>;
    detectFrame(video: HTMLVideoElement, timestampMs: number): HandTrackingResult | null;
    dispose(): void;
  }
  ```
- **Dependencies:** `@mediapipe/tasks-vision`.
- **Data Contracts:** Outputs `HandTrackingResult` containing raw 21 landmarks $(x, y, z)$, hand presence confidence, and handedness.
- **Test File:** `tests/unit/handTracker.test.ts`.

### 2.3 `src/gestures/gestureFeatures.ts`
- **Responsibility:** Pure mathematical calculation of scale-invariant palm distance, pinch ratio, joint angles, and palm normal.
- **Public Interface:**
  ```typescript
  export function calculateBiomechanicalFeatures(landmarks: Landmark3D[]): BiomechanicalFeatures;
  ```
- **Dependencies:** None.
- **Data Contracts:** Input: `Landmark3D[21]`. Output: `BiomechanicalFeatures` (`palmScale`, `pinchRatio`, `fingerCurl`, `palmNormal`).
- **Test File:** `tests/unit/gestures.test.ts`.

### 2.4 `src/gestures/oneEuroFilter.ts`
- **Responsibility:** Adaptive low-pass temporal filtering for 3D coordinates.
- **Public Interface:**
  ```typescript
  export class OneEuroFilter3D {
    constructor(minCutoff?: number, beta?: number, dCutoff?: number);
    filter(x: number, y: number, z: number, timestampMs: number): [number, number, number];
    reset(): void;
  }
  ```
- **Dependencies:** None.
- **Test File:** `tests/unit/stabilizer.test.ts`.

### 2.5 `src/interaction/interactionStateMachine.ts`
- **Responsibility:** Finite State Machine managing modal interaction states and safety invariants.
- **Public Interface:**
  ```typescript
  export class InteractionStateMachine {
    getState(): InteractionState;
    send(event: InteractionEvent): InteractionState;
    subscribe(listener: (state: InteractionState, prev: InteractionState) => void): () => void;
    reset(): void;
  }
  ```
- **Dependencies:** None (pure TypeScript).
- **Test File:** `tests/unit/fsm.test.ts`.

### 2.6 `src/scene/ProceduralEngine.ts`
- **Responsibility:** Parametric procedural geometry generation for the 8-stage turbofan assembly.
- **Public Interface:**
  ```typescript
  export function buildProceduralEngine(materials: EngineMaterialPalette): {
    rootGroup: THREE.Group;
    stageNodes: Map<ComponentId, THREE.Object3D>;
    selectableMeshes: THREE.Mesh[];
  };
  ```
- **Dependencies:** `three`, `ComponentRegistry.ts`.
- **Test File:** `tests/unit/proceduralEngine.test.ts`.

---

## 3. Module Dependency Graph

```
[ cameraService ] -> [ handTracker ]
                            |
                            v
                 [ gestureFeatures ] -> [ oneEuroFilter ]
                            |
                            v
                 [ gestureRecognizer ] -> [ gestureStabilizer ]
                                                |
                                                v
                                  [ interactionStateMachine ]
                                                |
                                                v
                                      [ actionDispatcher ]
                                                |
                                                +----------------------------+
                                                |                            |
                                                v                            v
                                         [ EngineScene ]           [ UI / Telemetry HUD ]
                                                |
                                         [ ProceduralEngine ]
                                                |
                                         [ ComponentRegistry ]
```

Notice the strict unidirectional flow: Vision and Gestures have **zero backward dependencies** on the 3D scene or UI.
