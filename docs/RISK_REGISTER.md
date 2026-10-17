# AERIS — Risk Register & Failure Mode Analysis
**Document ID:** AERIS-DOC-015  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Risk Matrix & Evaluation Methodology

Risks are assessed using a standard $3 \times 3$ qualitative matrix:
- **Likelihood:** Low (1), Medium (2), High (3)
- **Impact:** Low (1), Medium (2), Critical (3)
- **Severity Score:** $\text{Likelihood} \times \text{Impact}$ (Score 1–2: Low; 3–4: Moderate; 6–9: High).

```
+--------------------------------------------------------------------------------------------------+
|                                        SEVERITY MATRIX                                           |
+--------------------------------------------------------------------------------------------------+
|   CRITICAL IMPACT (3) |   [Moderate - 3]   |     [High - 6]     |     [High - 9]                 |
|   MEDIUM IMPACT (2)   |   [Low - 2]        |   [Moderate - 4]   |     [High - 6]                 |
|   LOW IMPACT (1)      |   [Low - 1]        |     [Low - 2]      |   [Moderate - 3]               |
+-----------------------+--------------------+--------------------+--------------------------------+
|                       |  LOW LIKELIHOOD (1)| MEDIUM LIKELIHOOD(2| HIGH LIKELIHOOD (3)            |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Engineering Failure Mode & Risk Register

| Risk ID | Risk Description | Likelihood | Impact | Severity | Detection Method | Mitigation Strategy | Contingency Plan | Verification Requirement |
|---|---|---|---|---|---|---|---|---|
| **RSK-CV-01** | **Camera Coordinate Jitter:** Sensor noise creates high-frequency trembling during static gestures. | **High (3)** | **Medium (2)** | **High (6)** | Moving std-dev of landmark coordinates during stationary holding fixture. | One-Euro Filter with low stationary cutoff frequency ($f_{c\_min} = 1.0 \text{ Hz}$). | Fallback to stronger EMA smoothing if hardware noise is extreme. | Unit test step response + empirical observation in HUD. |
| **RSK-CV-02** | **Jump Discontinuity on Tracking Recovery:** Hand re-entering camera frame creates large $\Delta(x, y)$ coordinate spike. | **High (3)** | **Critical (3)**| **High (9)** | Derivative velocity assertions during tracking loss simulation. | Invalidate drag anchors immediately upon tracking loss; force Frame 1 to re-seed anchor without emitting delta. | Clamp maximum rotational delta per frame to $\le 0.15 \text{ rad}$. | Frame dropout unit test simulating 500px sudden position jump. |
| **RSK-CV-03** | **Gesture Boundary Flickering:** Hand hovering near pinch threshold rapid-fires commands. | **Medium (2)** | **Medium (2)** | **Moderate (4)**| Event frequency counter logging state flips within $<100 \text{ ms}$. | Dual-threshold Schmitt trigger hysteresis ($0.22 / 0.35$) + 3-frame temporal debounce counter. | Increase debounce window from 3 to 5 frames if flicker persists. | Synthetic noisy threshold crossing test fixtures. |
| **RSK-CV-04** | **Camera Permission Denial:** User denies webcam access or webcam is disconnected. | **Medium (2)** | **Critical (3)**| **High (6)** | `navigator.mediaDevices.getUserMedia` catch block catching `NotAllowedError`. | Render prominent non-blocking banner stating application is operating in Fallback Mouse Mode. | All spatial interactions 100% accessible via OrbitControls and keyboard shortcuts. | Automated browser smoke test with camera permission blocked. |
| **RSK-CV-05** | **Inference Frame Drops on Weak CPUs:** MediaPipe takes $>35 \text{ ms}$ on low-end hardware, degrading rendering. | **Medium (2)** | **Medium (2)** | **Moderate (4)**| Telemetry HUD inference latency meter; FPS drop warnings. | Decouple Three.js render loop (rAF) from MediaPipe inference loop; throttle CV to 30 Hz. | Move MediaPipe inference to dedicated Web Worker with `OffscreenCanvas`. | Profile CPU timeline in Chrome DevTools under 4x CPU throttling. |
| **RSK-REN-01**| **Draw Call Bottleneck from Turbine Blades:** Hundreds of individual blade meshes overwhelm WebGL pipeline. | **High (3)** | **Critical (3)**| **High (9)** | `renderer.info.render.calls` query exceeding budget of 30 calls. | Group blades into `THREE.InstancedMesh` per stage; share single buffer geometry and material. | Merge static stator meshes into single unified geometry buffer. | Scene info assertion confirming $< 20$ draw calls for full engine. |
| **RSK-REN-02**| **Depth Sorting Artifacts on Transparent CAD:** Transparent bypass duct creates flickering sorting glitches with core blades. | **Medium (2)** | **Low (1)** | **Low (2)** | Visual inspection of rotating engine; inverted blade visibility. | Render opaque core stages with `depthWrite: true`, transparent casing with `depthWrite: false` and renderOrder 1. | Enable alpha-to-coverage or additive wireframe rendering without depth sorting. | Visual audit under orbit rotation. |
| **RSK-INT-01**| **Leaf Mesh Raycast Ambiguity:** Raycaster hits single blade or screw, failing to select overall stage. | **High (3)** | **Medium (2)** | **Moderate (6)**| Raycaster returns leaf `Mesh` with undefined `componentId`. | Hierarchy crawler traversing parent nodes until `userData.componentId` is encountered. | Stamp `userData.componentId` directly onto all instanced child meshes during assembly generation. | Unit test clicking child mesh and asserting parent `ComponentId` resolved. |
| **RSK-INT-02**| **Exploded View Transform Accumulation Drift:** Rapid toggling of exploded view causes parts to misalign. | **Medium (2)** | **Medium (2)** | **Moderate (4)**| Transform position assertions after 20 explode/collapse cycles. | Exploded offset formulated as absolute parametric scalar $\lambda \in [0.0, 1.0]$ multiplied by base offset. | Re-center all stages to hardcoded origin $(0, 0, 0)$ on reset action. | Automated integration test toggling exploded view 50 times. |
| **RSK-LIC-01**| **Unverified Third-Party 3D Model License:** External GLB download violates copyright or lacks attribution. | **Low (1)** | **Critical (3)**| **Moderate (3)**| Pre-commit asset audit; license manifest check. | Default to 100% procedural Three.js geometry authored directly in repository under MIT license. | Reject any external asset lacking clear CC0 / CC-BY documentation from verified institutions. | License review checklist in `ASSET_SELECTION.md`. |
