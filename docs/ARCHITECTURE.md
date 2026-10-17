# AERIS — System Architecture & Component Registry Contract
**Document ID:** AERIS-DOC-003  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Architectural Philosophy & Principles

AERIS is engineered around four core architectural principles:
1. **Unidirectional Event & Data Flow:** Vision inputs flow downstream through feature extraction, gesture classification, and the state machine before generating typed actions for the 3D scene. The 3D scene never inspects raw landmarks or queries the camera directly.
2. **Strict Decoupling of Subsystems:** The gesture layer has zero dependencies on Three.js, React, or the DOM. It can be compiled and executed in a headless Node.js process or test suite.
3. **Decoupled Execution Loops:** Camera frames (typically 30–60 Hz), MediaPipe inference (variable 20–50 Hz), and Three.js rendering (synced to display refresh rate at 60–144 Hz via `requestAnimationFrame`) operate asynchronously without blocking each other.
4. **Contract-Driven Scene Graph:** Every mechanical part in the 3D scene binds to a centralized **Shared Component Registry** that provides stable identities, bounding boundaries, pivot anchors, exploded translation vectors, and engineering metadata.

---

## 2. High-Level Subsystem Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                        HIGH-LEVEL ARCHITECTURE                                          |
+---------------------------------------------------------------------------------------------------------+
|                                                                                                         |
|   +-------------------+       +-----------------------+       +-------------------------------------+   |
|   |   VISION LAYER    | ----> |     GESTURE LAYER     | ----> |         INTERACTION ENGINE          |   |
|   | - cameraService   |       | - gestureFeatures     |       | - interactionStateMachine (FSM)     |   |
|   | - handTracker     |       | - oneEuroFilter       |       | - actionDispatcher                  |   |
|   |                   |       | - gestureRecognizer   |       | - spatialMapper (Coords -> NDC)     |   |
|   +-------------------+       +-----------------------+       +-------------------------------------+   |
|                                                                                  |                      |
|                                                                                  v Dispatched Actions   |
|                                                               +-------------------------------------+   |
|                                                               |           3D SCENE GRAPH            |   |
|                                                               | - EngineScene (Three.js WebGL)      |   |
|                                                               | - ProceduralEngine (8 Assemblies)   |   |
|                                                               | - ComponentRaycaster                |   |
|                                                               | - ExplodedViewEngine                |   |
|                                                               +-------------------------------------+   |
|                                                                                  |                      |
|                                                                                  v Synchronized State   |
|   +-------------------------------------------------------------------------------------------------+   |
|   |                                    UI & DIAGNOSTICS HUD                                         |   |
|   | - Monospace Telemetry (FPS, Inference ms, Confidence) - Component Dossier - Fallback Controls   |   |
|   +-------------------------------------------------------------------------------------------------+   |
|                                                                                                         |
+---------------------------------------------------------------------------------------------------------+
```

---

## 3. Subsystem Responsibility Matrix

| Subsystem | Primary Responsibility | Inputs | Outputs | State Maintained | Testing Boundary |
|---|---|---|---|---|---|
| **Vision Subsystem** (`src/vision/`) | Video stream capture, hardware lifecycle, MediaPipe Tasks execution, raw landmark extraction. | Web user permission event, webcam hardware stream. | Raw 21 3D landmarks ($x,y,z$) + tracking validity flag + timestamp. | Stream state (`INACTIVE`, `STREAMING`, `DENIED`), MediaPipe Landmarker instance. | Mock camera stream; synthetic frame feeding; stream shutdown assertions. |
| **Gesture Subsystem** (`src/gestures/`) | Biomechanical feature computation, coordinate jitter filtration, rule-based gesture classification, temporal debouncing. | Raw landmark arrays from Vision Subsystem. | Stabilized landmarks, classified gesture intent (`PINCH`, `POINT`, `PALM`, etc.), confidence metric. | One-Euro filter state buffers, hysteresis thresholds, frame debounce counters. | Headless pure TypeScript tests with synthetic landmark vectors. 100% deterministic. |
| **Interaction Subsystem** (`src/interaction/`) | Enforcing modal interaction rules, preventing transform jumps, mapping normalized coordinates to screen/NDC, dispatching scene actions. | Stabilized gestures, hand velocities, canvas viewport dimensions. | Typed scene actions (`ROTATE_SCENE`, `SELECT_STAGE`, `SET_EXPLODE`, etc.). | FSM state (`IDLE`, `MANIPULATING`, `LOST`, etc.), active drag anchor, selected component ID. | FSM transition unit tests; action payload validation; coordinate mapping assertions. |
| **3D Rendering Subsystem** (`src/scene/`) | Procedural mesh generation, PBR/CAD shader rendering, scene graph transformations, raycasting, exploded view animation. | Typed scene actions, canvas resize events, delta time ($dt$). | Rendered WebGL canvas buffer, hovered/selected component events. | Scene graph tree, camera matrices, current rotation quaternion, explode progress ($0.0 \to 1.0$). | WebGL context mock tests; bounding box geometry tests; exploded offset regression tests. |
| **UI & Telemetry Subsystem** (`src/ui/`) | Rendering aerospace CAD HUD, displaying real-time diagnostic metrics, component metadata drawer, fallback mouse/keyboard controls. | FSM state changes, component selection events, performance metrics (FPS, ms). | DOM elements, user fallback interaction events. | HUD collapsed/expanded state, active visual theme mode, telemetry history buffers. | React component tests (happy-dom/JSDOM); accessibility keyboard navigation tests. |

---

## 4. Execution Loops & Threading Model

To ensure steady 60 FPS rendering regardless of computer-vision frame rate variations, AERIS decouples processing across three asynchronous cadences:

```
+--------------------------------------------------------------------------------------------------+
|                                  CADENCE & LOOP DECOUPLING                                       |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
| [Webcam Hardware Stream]  ~30 Hz                                                                 |
|       |                                                                                          |
|       v                                                                                          |
| 1. CV INFERENCE CADENCE (requestVideoFrameCallback or rAF throttled)                            |
|    - handLandmarker.detectForVideo(videoElement, timestamp)                                      |
|    - Runtime: 12ms - 22ms per frame                                                              |
|    - Emits: onLandmarksDetected(landmarks, timestamp)                                            |
|       |                                                                                          |
|       v                                                                                          |
| 2. GESTURE & INTERACTION CADENCE (Synchronous with CV output)                                    |
|    - OneEuroFilter.filter(landmarks)                                                             |
|    - computeBiomechanicalFeatures()                                                              |
|    - evaluateGestureRules()                                                                      |
|    - fsm.send(event)                                                                             |
|    - actionDispatcher.dispatch(action) -> updates Shared Interaction Store / Target Transform    |
|                                                                                                  |
| ------------------------------------------------------------------------------------------------ |
|                                                                                                  |
| 3. RENDER CADENCE (Dedicated requestAnimationFrame - 60 Hz / 120 Hz)                             |
|    - Lerp current rotation quaternion towards target transform                                   |
|    - Interpolate exploded view displacement progress                                             |
|    - Rotate rotor spools (LP & HP shafts) based on delta time dt                                 |
|    - Update ComponentRaycaster if pointing mode is active                                        |
|    - renderer.render(scene, camera)                                                              |
|    - Measure render frame duration for HUD FPS meter                                             |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Threading Evaluation: Main Thread vs Web Workers
- **Current Decision:** Execute MediaPipe Tasks Vision on the **Main Thread** using the WebAssembly/GPU delegate.
- **Justification:** MediaPipe Tasks Vision WebAssembly delegate internally leverages WebGL/OffscreenCanvas rendering. Passing raw `HTMLVideoElement` frames to a Web Worker requires either `ImageBitmap` transfers or `OffscreenCanvas` transferControlToOffscreen, which adds 3–5 ms serialization overhead and exhibits inconsistent browser support across iOS/macOS Safari. Given that MediaPipe WebAssembly execution takes ~15 ms on modern hardware, the main thread retains sufficient headroom (>70% idle during a 16.6 ms frame budget) when graphics updates are lightweight.
- **Worker Escape Hatch:** If profiling on low-power devices indicates inference frame drops impact render frame rates, the pipeline is architected so `handTracker.ts` can be swapped with a Worker-backed proxy without altering any downstream gesture or scene modules.

---

## 5. Shared Component Registry Design

The **Shared Component Registry** is the central data contract unifying the 3D scene graph, raycasting, highlighting, selection, exploded-view kinematics, and UI technical dossiers.

```
+--------------------------------------------------------------------------------------------------+
|                                   SHARED COMPONENT REGISTRY                                      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|           +-----------------------+              +------------------------+                      |
|           | Procedural Geometry   |              | Three.js Scene Graph   |                      |
|           | (Parametric Meshes)   |              | (Named Object3D Nodes) |                      |
|           +-----------------------+              +------------------------+                      |
|                       |                                      |                                   |
|                       +------------------+-------------------+                                   |
|                                          |                                                       |
|                                          v                                                       |
|                         +---------------------------------+                                      |
|                         |    COMPONENT REGISTRY TABLE     |                                      |
|                         |  - Stable Unique ID             |                                      |
|                         |  - Aerospace Display Name       |                                      |
|                         |  - Parent Assembly ID           |                                      |
|                         |  - Exploded Direction & Delta   |                                      |
|                         |  - Bounding Box & Pivot Point   |                                      |
|                         |  - Material Highlight Policy    |                                      |
|                         |  - Technical Spec Metadata      |                                      |
|                         +---------------------------------+                                      |
|                                          |                                                       |
|                       +------------------+-------------------+                                   |
|                       |                                      |                                   |
|                       v                                      v                                   |
|           +-----------------------+              +------------------------+                      |
|           | Raycaster & Highligh  |              | Contextual HUD Dossier |                      |
|           | (Outline Emissive)    |              | (Engineering Specs)    |                      |
|           +-----------------------+              +------------------------+                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 5.1 Component Data Contract Interface

```typescript
export type ComponentId = 
  | 'intake_spinner'
  | 'fan_blades'
  | 'lpc_booster'
  | 'hpc_core'
  | 'combustor'
  | 'hpt_turbine'
  | 'lpt_turbine'
  | 'exhaust_nozzle'
  | 'outer_casing';

export interface ComponentMetadata {
  /** Canonical display name */
  displayName: string;
  /** Sub-assembly classification */
  category: 'Cold Section' | 'Core / Hot Section' | 'Exhaust' | 'Structural';
  /** Aerospace engineering specifications (Simulated for visualization) */
  specifications: {
    operatingRpm: string;
    temperatureRange: string;
    compressionOrExpansionRatio: string;
    materialAlloy: string;
    stageCount?: number;
    coolingType?: string;
  };
  /** Provenance disclaimer */
  provenance: 'Procedural CAD Approximation — Parametric Reference Model';
}

export interface ComponentRegistryEntry {
  id: ComponentId;
  parentId: ComponentId | null;
  metadata: ComponentMetadata;
  /** Reference to the Three.js root Group or Mesh for this assembly */
  sceneNodeName: string;
  /** Normalized exploded vector [x, y, z] and maximum travel distance in scene units */
  explodedTransform: {
    direction: [number, number, number];
    maxDistance: number;
  };
  /** Highlighting policy configuration */
  highlightConfig: {
    baseEmissive: number;
    hoverEmissive: number;
    selectEmissive: number;
    accentColor: string;
  };
  isSelectable: boolean;
}
```

### 5.2 Child Mesh Resolution to Parent Assembly
In a complex multi-stage assembly, individual turbine blades, stator vanes, and rotor disks are distinct Three.js `Mesh` instances grouped under a parent `Group`. 
- When the screen-space raycaster intersects a leaf `Mesh`, the system traverses up the Three.js parent hierarchy:
  ```typescript
  export function resolveComponentFromIntersection(intersectedObject: THREE.Object3D): ComponentId | null {
    let current: THREE.Object3D | null = intersectedObject;
    while (current) {
      if (current.userData && current.userData.componentId) {
        return current.userData.componentId as ComponentId;
      }
      current = current.parent;
    }
    return null;
  }
  ```
- This ensures that clicking or pointing at any individual fan blade reliably selects the entire `fan_blades` stage.

### 5.3 External GLB Model Mapping
If an external GLB is loaded:
1. The loader parses the GLB scene hierarchy.
2. A declarative mapping table binds glTF node names (e.g. `"Node_Turbine_HP"`) to the standard `ComponentId` (`"hpt_turbine"`).
3. The bounding box, pivot point, and `userData.componentId` are stamped onto the glTF node.
4. Downstream raycasting, exploded view animation, and HUD dossiers function identically without rewriting any code.
