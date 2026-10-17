# AERIS — Summary of Architectural Implementation Decisions & Conflict Resolutions
**Document ID:** AERIS-DOC-017  
**Status:** APPROVED FOR IMPLEMENTATION  
**Date:** 2026-10-17  

---

## 1. Architectural Commitments & Consensus

| Domain | Selected Decision | Core Justification | Key Trade-Off Acknowledged |
|---|---|---|---|
| **1. 3D Asset Strategy** | **Procedural-First Parametric Three.js Model** | Guarantees 100% clean MIT licensing, zero download latency, deterministic node hierarchy, and calibrated exploded vectors. | Requires writing custom parametric geometry algorithms for fan blades, disks, and combustor. |
| **2. 3D Graphics Integration**| **Vanilla Three.js in React Viewport Container** | Direct lifecycle control, transparent garbage collection, zero reconciliation overhead in 60 FPS animation loop. | Requires manual canvas resize listeners and explicit buffer disposal routines. |
| **3. Computer Vision Engine** | **Google MediaPipe Tasks Vision (WASM / GPU)** | State-of-the-art accuracy, native 3D landmarks, local offline inference, $<20 \text{ ms}$ latency on desktop. | Requires hosting 10 MB `.task` model and WebAssembly binaries in `/public/`. |
| **4. Coordinate Smoothing** | **One-Euro ($\text{1€}$) Adaptive Low-Pass Filter** | Eliminates static jitter without introducing drag latency during rapid sweeps; mathematically calibrated for human spatial UI. | Computes derivative velocity per landmark (negligible $<0.05 \text{ ms}$ overhead). |
| **5. Gesture Classifier** | **Deterministic Biomechanical Rules** | 100% explainable, deterministic, zero training overhead, sub-millisecond execution, scale-invariant via $d_{\text{palm}}$ ratio. | Requires careful geometric threshold formulation and edge-case boundary testing. |
| **6. State Management** | **Custom Pure-TypeScript Finite State Machine** | Minimal footprint (<2 KB), zero external dependencies, 100% unit-testable in headless Node, strictly enforces invariants. | State transition matrix must be maintained manually in code. |
| **7. Draw-Call Optimization**| **`THREE.InstancedMesh` Blade Ring Clustering** | Renders 1000+ turbine and compressor blades in $<20$ draw calls, ensuring steady 60 FPS on integrated GPUs. | Individual blade instances must be transformed via a shared 4x4 matrix buffer. |
| **8. Interaction Decoupling** | **Asynchronous Loop Architecture** | Isolates 30 Hz webcam frame arrival, 20–50 Hz CV inference, and 60 Hz WebGL rendering into independent asynchronous cadences. | Requires thread-safe shared target transform buffers to prevent tearing. |
| **9. Fault Recovery** | **Stateful Anchor Invalidation on Tracking Loss** | Clamps rotational deltas to zero when hand drops; re-seeds anchor coordinates on re-entry to eliminate jump discontinuities. | Requires tracking state transitions through an explicit `RECOVERY` intermediate state. |
| **10. Privacy & Security** | **100% Client-Side Local Execution** | Zero video frames or tracking coordinates transmitted over network; complete offline capability. | Requires client hardware to support WebAssembly and WebGL 2.0. |

---

## 2. Specification Conflict & Ambiguity Resolutions

During the architectural audit, several subtle specification ambiguities across earlier documents were analyzed and resolved:

### 2.1 Canonical State Machine Naming
- **Conflict:** Some early drafts mentioned `MANIPULATING_ZOOM` as a parallel primary state, while `INTERACTION_STATE_MACHINE.md` prioritized `MANIPULATING_ROTATION` and treated zoom as a parameter or sub-action.
- **Resolution:** Canonical FSM states are explicitly unified as:
  `IDLE`, `TRACKING`, `GESTURE_CANDIDATE`, `GESTURE_CONFIRMED`, `MANIPULATING_ROTATION`, `COMPONENT_TARGETING`, `OBJECT_SELECTED`, `TRACKING_LOST`, `RECOVERY`.
  Zooming is handled via continuous pinch-spread distance deltas when in `MANIPULATING_ROTATION` or secondary hand scaling, avoiding redundant state explosion.

### 2.2 Coordinate Mirroring Single-Source-of-Truth
- **Conflict:** When webcams are mirrored for intuitive self-view, coordinate flipping ($x_m = 1.0 - x$) could accidentally be applied multiple times (e.g. in vision layer AND in spatial mapping).
- **Resolution:** Mirroring is strictly applied **once** at the boundary of `handTracker.ts` when converting MediaPipe normalized landmarks to canonical AERIS normalized coordinates. Downstream consumers (`spatialMapper.ts`, raycaster, gesture features) operate exclusively on mirrored normalized coordinates where $x = 0$ is left and $x = 1$ is right.

### 2.3 Mutual Exclusivity of Selection vs Background Rotation
- **Conflict:** A pinch gesture might simultaneously trigger model rotation and component selection if a ray hits an engine part.
- **Resolution:** The FSM enforces strict mutual exclusivity:
  - If state is `COMPONENT_TARGETING` and ray hits a component $\to$ a pinch transition enters `OBJECT_SELECTED`, locking the component and opening the dossier without rotating the model.
  - If state is `TRACKING` and ray hits the background $\to$ a pinch transition enters `MANIPULATING_ROTATION`, rotating the model without changing component selection.
