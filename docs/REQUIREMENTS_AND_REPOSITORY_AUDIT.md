# AERIS — Requirements and Repository Audit
**Document ID:** AERIS-DOC-001  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  
**Workspace:** `c:\Users\siddu\OneDrive\Desktop\New folder`

---

## 1. Repository State Analysis

An automated inspection of the current workspace (`c:\Users\siddu\OneDrive\Desktop\New folder`) was conducted.

| Audit Dimension | Finding | Technical Implication |
|---|---|---|
| **Workspace Contents** | 0 files, 0 directories (Completely Empty) | Clean-slate greenfield project. No legacy constraints, technical debt, or existing dependencies. |
| **Existing Frameworks** | None detected | Architecture must be established from scratch using verified modern releases. |
| **Package Manifest** | None (`package.json` absent) | Tooling, runtime dependencies, build scripts, and test harnesses must be explicitly specified. |
| **Existing Assets / 3D Models**| None detected | Visual assets must either be generated procedurally in code or loaded via explicit permissive assets. |
| **Testing Harness** | None detected | Test infrastructure (unit, integration, DOM, WebGL mock) must be configured upfront. |

**Audit Conclusion:**  
Because the workspace is empty, all architectural specifications, data contracts, and implementation plans in this documentation package are derived directly from the engineering requirements, physics/biomechanical models, and browser runtime constraints, rather than adapting to an existing codebase.

---

## 2. Requirements Traceability Matrix

Requirements are prioritized using the MoSCoW framework:
- **Must Have (M):** Non-negotiable core capability required for the primary interaction loop and engineering validity.
- **Should Have (S):** Important secondary capabilities that complete the aerospace CAD exploration experience.
- **Could Have (C):** Desirable extensions that add portfolio/research depth if time permits.
- **Deferred (D):** Explicitly out of scope for the current engineering milestone.

| Req ID | Description | Priority | Rationale | Dependencies | Proposed Implementation | Verification Method | Acceptance Criteria |
|---|---|---|---|---|---|---|---|
| **REQ-VIS-01** | Explicit Camera Lifecycle Management | **M** | Browser permissions require user activation; streams must clean up on unmount. | None | `cameraService.ts` wrapping `MediaDevices.getUserMedia` with deterministic state machine. | Automated mock tests + live browser permission testing. | Camera requests only when user clicks "Engage Vision"; cleanly shuts down hardware indicator on toggle. |
| **REQ-VIS-02** | Real-Time Hand Landmark Extraction | **M** | Spatial tracking requires continuous 3D hand coordinates. | REQ-VIS-01 | MediaPipe Tasks Vision `HandLandmarker` in `VIDEO` mode with WebAssembly delegate. | Landmark sanity assertions + live frame rate measurement. | Extracts 21 3D landmarks at $\ge 30$ FPS with inference latency $< 25$ ms on standard modern hardware. |
| **REQ-VIS-03** | Scale-Invariant Landmark Normalization | **M** | Fixed pixel thresholds fail when user moves hand closer/farther from camera. | REQ-VIS-02 | Normalize distances by palm reference metric $d_{palm} = \|P_9 - P_0\|$. | Unit tests with scaled synthetic hand models. | Pinch threshold evaluates identically whether hand occupies 10% or 60% of camera frame. |
| **REQ-GES-01** | Deterministic Pinch Recognition | **M** | Primary grab/manipulation trigger must be explainable and reliable. | REQ-VIS-03 | Rule-based classifier evaluating normalized tip separation $\frac{\|P_4 - P_8\|}{d_{palm}}$. | Synthetic landmark test vectors across 100 variations. | Detects pinch with zero false-positives on open palm and fist poses. |
| **REQ-GES-02** | Temporal Stabilization & Anti-Flicker | **M** | Raw camera landmarks exhibit 1–3 pixel jitter; single-frame misdetections cause flicker. | REQ-GES-01 | One-Euro Filter on continuous coordinates + dual-threshold hysteresis + 3-frame debounce. | Step response unit tests; noise injection test fixtures. | Eliminates high-frequency coordinate jitter while keeping latency overhead $< 16$ ms. |
| **REQ-GES-03** | Tracking-Loss Detection & Discontinuity Suppression | **M** | Missing hand or occlusion must not cause wild transforms or stuck states. | REQ-VIS-02 | Instant tracking-loss timeout (clamping deltas to 0), followed by anchor reset upon re-acquisition. | Frame dropout simulation tests. | Hand exit from frame produces 0 transform drift; hand re-entry produces zero transform jumps. |
| **REQ-FSM-01** | Formal Interaction State Machine | **M** | Decouples vision/gestures from Three.js scene mutations; ensures deterministic behavior. | REQ-GES-01, REQ-GES-02 | Strict FSM (`IDLE`, `TRACKING`, `CANDIDATE`, `CONFIRMED`, `MANIPULATING`, `LOST`, `RECOVERY`). | Pure TypeScript unit tests covering all valid/invalid transitions. | Scene updates occur only when FSM is in `MANIPULATING_*` or `TARGETING` states. |
| **REQ-REN-01** | Procedural Multi-Stage Jet Engine Assembly | **M** | Demonstrates real graphics engineering; 100% clean licensing; modular component tree. | None | Three.js procedural parametric geometry generator with 8 functional aerospace stages. | Visual inspection, bounding box assertions, memory profiling. | Engine displays 8 distinct mechanical stages, correctly grouped with accurate local pivots. |
| **REQ-REN-02** | Continuous Pinch-and-Drag 3D Rotation | **M** | Core spatial interaction mechanism for orbital inspection. | REQ-FSM-01, REQ-REN-01 | Action dispatcher translates smoothed hand centroid $\Delta(x, y)$ into quaternion/Euler rotation. | End-to-end integration test + live user verification. | Pinch-drag produces smooth, intuitive model rotation matching hand trajectory without gimbal lock. |
| **REQ-REN-03** | Accessible Keyboard & Mouse Fallback Controls | **M** | Guarantees usability when camera is unavailable, denied, or in low light. | REQ-REN-01 | Standard Three.js `OrbitControls` fallback arbitration when vision is idle or disabled. | Automated DOM/Canvas synthetic mouse/keyboard events. | Full inspection, rotation, zoom, and component selection operable via mouse drag and keypresses. |
| **REQ-SEL-01** | Component Spatial Targeting & Raycasting | **S** | Allows user to identify and inspect individual engine subsystems. | REQ-REN-01, REQ-VIS-03 | Screen-space raycaster mapped from stabilized index fingertip pointing ray or mouse pointer. | Raycasting unit tests against component bounding hierarchies. | Pointing at a stage highlights its mesh and opens the aerospace technical specification dossier. |
| **REQ-EXP-01** | Multi-Axis Axial Exploded View | **S** | Reveals internal spools, combustor liners, and turbine disks. | REQ-REN-01, REQ-FSM-01 | Parametric stage translation along engine centerline ($Z$-axis) with radial casing expansion. | Transform regression tests ensuring perfect reversible collapse. | Stages separate cleanly along authored trajectories without collision; collapses to identical origin. |
| **REQ-ZOM-01** | Spatial Depth & Zoom Control | **S** | Enables inspection of micro-details on compressor blisks and turbine blades. | REQ-FSM-01, REQ-GES-01 | Pinch-spread distance or secondary hand delta mapped to camera field of view / dolly distance. | Zoom limit bounds testing. | Zoom operates within strict min/max distance clamping; prevents clipping through inner shafts. |
| **REQ-HUD-01** | Aerospace Engineering Telemetry HUD | **S** | High-contrast technical interface displaying real system metrics without pseudo-scientific fluff. | REQ-FSM-01, REQ-VIS-02 | Modern React HUD overlay with monospace typography, live FPS, inference ms, and state readouts. | Component render tests; performance profiling. | Displays measured rendering FPS, MediaPipe latency, tracking confidence, and active FSM state. |
| **REQ-OPT-01** | Zero-Allocation Hot Path Optimization | **S** | Prevents GC stutter and maintains solid 60 FPS rendering. | REQ-REN-01, REQ-VIS-02 | Object pooling for 3D vectors/quaternions/matrices; typed arrays for landmark cache. | Memory allocation profiling in Chrome DevTools / Vitest. | Zero heap object allocations inside `requestAnimationFrame` and `onFrame` landmark processing loops. |
| **REQ-TWO-01** | Two-Handed Simultaneous Spatial Manipulation | **C** | Dual-hand manipulation (left hand anchors position, right hand scales/rotates). | REQ-VIS-02, REQ-FSM-01 | Multi-hand tracking processor arbitrating two independent hand landmark trees. | Synthetic multi-hand fixture tests. | Left hand grabs engine center while right hand pulls outward to dynamically drive explosion distance. |
| **REQ-MAT-01** | Dual Render Modes (Hologram CAD vs PBR Engineering) | **C** | Supports both technical wireframe CAD style and realistic metallic thermal-barrier style. | REQ-REN-01 | Shader material switcher swapping between additive wireframe shaders and metallic PBR materials. | Shader compilation tests. | Instantaneous material toggle without scene reconstruction or geometry recomputation. |
| **REQ-EXT-01** | External glTF/GLB Engine Model Loader | **C** | Allows loading high-detail external community/NASA CAD models if provided. | REQ-REN-01 | Three.js `GLTFLoader` with automated node hierarchy mapping to Shared Component Registry. | GLB schema validation test suite. | Validated GLB models successfully bind to component registry and respond to explode/select actions. |
| **REQ-NET-01** | Backend / Remote Telemetry Sync | **D** | External server synchronization, databases, or cloud processing. | None | N/A (Deferred) | N/A | Strictly omitted. AERIS is 100% client-side, zero-telemetry, zero-network-dependency by design. |
| **REQ-AI-01** | Cloud LLM Chat Assistant | **D** | Natural language chat interface for engine questions. | None | N/A (Deferred) | N/A | Strictly omitted. Does not contribute to core spatial interaction and introduces latency/costs. |

---

## 3. Ambiguities & Engineering Resolutions

1. **Ambiguity: MediaPipe Landmark Coordinate System vs Screen Space**
   - *Resolution:* MediaPipe returns normalized coordinates where $(x, y) \in [0, 1]$ with origin at top-left. Three.js Normalized Device Coordinates (NDC) span $[-1, 1]$ with origin at center and $y$ inverted. Furthermore, webcams require horizontal mirroring so moving the physical right hand to the right moves the spatial cursor to the right. A dedicated transformer function `normalizeVisionToNDC(x, y, isMirrored)` will be established and unit-tested to prevent inverted or misaligned interactions.
2. **Ambiguity: Physical CAD Accuracy vs Browser Real-Time Rendering**
   - *Resolution:* True aeronautical CAD models (e.g. Siemens NX or CATIA files) contain millions of NURBS surfaces that exceed browser WebGL memory limits. AERIS deliberately implements *procedurally plausible aerospace geometry* optimized for real-time 60 FPS rendering, using exact stage counts, rotational symmetry, and realistic blade profiles, but utilizing optimized polygon meshes with instanced rotor blade arrays.
3. **Ambiguity: Pointing Selection vs Pinch Grab Conflict**
   - *Resolution:* A user cannot reliably point and pinch simultaneously. The interaction state machine enforces strict mutual exclusivity:
     - `POINTING`: Index finger extended, other fingers curled $\to$ Casts targeting ray; highlights hovered component.
     - `PINCH`: Index tip touches thumb tip $\to$ Locks selection if pointing, or enters model manipulation mode if grasping the background.
