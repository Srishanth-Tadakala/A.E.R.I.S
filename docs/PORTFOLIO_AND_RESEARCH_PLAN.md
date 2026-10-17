# AERIS — Portfolio & Research Plan
**Document ID:** AERIS-DOC-016  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Engineering Portfolio Framing & Technical Rigor

AERIS is structured to demonstrate genuine full-stack systems engineering rather than a superficial frontend showcase. In technical interviews and code audits, the project demonstrates mastery across seven distinct engineering disciplines:

| Discipline | Standard Web Demo (Superficial) | AERIS Engineering Implementation (Defensible) |
|---|---|---|
| **Computer Vision** | Attaches webcam; logs raw landmarks to console. | Complete camera stream lifecycle; tracking confidence gating; camera mirroring; WebAssembly/GPU delegate execution; zero-latency video frame callback. |
| **Biomechanical Signal Processing**| Fixed pixel threshold (e.g. `dist < 30px`). Fails at different distances. | Scale-invariant anatomical normalization ($d_{\text{palm}}$); One-Euro adaptive low-pass filtering; Schmitt-trigger hysteresis; temporal frame debouncing. |
| **Software Architecture** | Vision code directly mutates Three.js meshes inside React components. | Strict unidirectional architecture: Vision $\to$ Gestures $\to$ FSM $\to$ Action Dispatcher $\to$ 3D Scene Graph. Gesture layer has zero Three.js/DOM coupling. |
| **Interaction Engineering** | Model spins uncontrollably when hand drops out of frame. | Formal 9-state FSM; automatic velocity clamping; stateful anchor invalidation on recovery; complete keyboard/mouse fallback parity. |
| **Real-Time 3D Graphics** | Single static imported `.obj`/`.gltf` mesh or primitive cubes. | Parametric 8-stage turbofan assembly built in Three.js; `THREE.InstancedMesh` blisk clustering ($< 20$ draw calls for 1000+ blades); dual CAD/PBR shader pipelines. |
| **Quality Assurance** | "It works on my machine" manual testing. | Automated Vitest test suite with synthetic landmark fixtures; FSM transition exhaustiveness tests; empirical real-camera evaluation protocol. |
| **Performance Engineering** | Unchecked heap allocations triggering GC frame drops. | Zero heap allocations inside animation hot paths; device pixel ratio clamping; transparent mesh renderOrder management. |

---

## 2. Research Questions & Academic Extensions

For academic demonstrations or further human-computer interaction (HCI) research, AERIS establishes a clean baseline for evaluating:

1. **Adaptive Hysteresis in Vision-Based Spatial UI:**  
   *Question:* Can hysteresis threshold bands dynamically widen/narrow based on real-time lighting noise and camera signal-to-noise ratio (SNR) to reduce both false activations and fatigue?
2. **Proprioceptive vs Visual Feedback in Mid-Air Pinch-and-Drag:**  
   *Question:* Does a screen-space visual reticle with dynamic predictive leading indicators compensate for the lack of haptic feedback during mid-air spatial CAD inspection?
3. **Multi-Modal Spatial Command Paradigms:**  
   *Question:* Evaluating user error rates when spatial manipulation (hand tracking) is paired with discrete voice commands ("Explode Core", "Select Fan") compared to pure gesture triggers.

---

## 3. Portfolio Verification Assets & Artifact Deliverables

Upon completion of the implementation phase, the following verified technical artifacts will be published in the project repository:

1. **Live Demonstration Video:**  
   Screen capture showing simultaneous webcam PIP (with active landmark skeleton) and the resulting smooth 3D engine rotation, component targeting, and exploded view expansion.
2. **Recorded Profiler Traces:**  
   Chrome DevTools Performance trace showing stable 60 FPS rendering and $< 18 \text{ ms}$ MediaPipe inference without GC frame drops.
3. **Automated Test Report:**  
   Terminal output of passing Vitest unit assertions covering gesture feature mathematics, One-Euro filter step response, and FSM transition matrix.
4. **Empirical Measurement Table:**  
   Populated table of actual measured Precision, Recall, and Latency collected via the physical camera testing protocol.
