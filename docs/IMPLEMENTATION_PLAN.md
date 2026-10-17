# AERIS — Master Implementation Blueprint
**Document ID:** AERIS-MASTER-001  
**Project:** AERIS (Adaptive Engine Rendering & Interactive Spatial Interface)  
**Status:** COMPLETE — AWAITING USER APPROVAL TO COMMENCE IMPLEMENTATION  
**Date:** 2026-10-17  
**Workspace Root:** `c:\Users\siddu\OneDrive\Desktop\New folder`

---

## 1. Executive Summary & Vision

**AERIS** is a browser-based, computer-vision-driven spatial interaction platform that enables intuitive manipulation, inspection, and multi-axis exploded visualization of a 3D dual-spool turbofan jet engine using real-time hand gestures captured via a standard webcam.

Unlike superficial web demos that bind raw landmarks directly to 3D scene objects, AERIS is architected as an **engineering-grade spatial computing platform**. It implements:
- Strict mathematical scale invariance.
- One-Euro adaptive temporal jitter filtering.
- Dual-threshold Schmitt trigger hysteresis.
- Formal 9-state finite state machine control.
- Draw-call-optimized procedural CAD aerospace geometry ($<20$ draw calls for 1000+ blades).
- Full mouse/keyboard fallback parity.
- Comprehensive automated test harnesses and empirical performance metrics.

---

## 2. Planning Documentation Suite Index

This master blueprint is supported by 17 detailed technical specifications created in the project repository:

1. [docs/REQUIREMENTS_AND_REPOSITORY_AUDIT.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/REQUIREMENTS_AND_REPOSITORY_AUDIT.md) — Greenfield workspace audit, MoSCoW traceability matrix, and engineering assumptions.
2. [docs/TECHNOLOGY_EVALUATION.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/TECHNOLOGY_EVALUATION.md) — 7 comprehensive Architecture Decision Records (ADRs) with empirical trade-off evaluations.
3. [docs/ARCHITECTURE.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/ARCHITECTURE.md) — End-to-end system topology, execution loops, and Shared Component Registry data contracts.
4. [docs/PROCEDURAL_ENGINE_DESIGN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/PROCEDURAL_ENGINE_DESIGN.md) — 8-stage parametric jet engine design, instanced blisk geometry, and dual CAD/PBR shader palettes.
5. [docs/VISION_PIPELINE.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/VISION_PIPELINE.md) — MediaPipe Tasks Vision integration, stream lifecycles, and camera-mirroring mathematics.
6. [docs/GESTURE_SPECIFICATION.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/GESTURE_SPECIFICATION.md) — Biomechanical feature equations, One-Euro filter math, hysteresis bands, and debounce rules.
7. [docs/SPATIAL_INTERACTION_DESIGN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/SPATIAL_INTERACTION_DESIGN.md) — Coordinate transformations (NIC $\to$ NDC $\to$ Screen), pointing raycasts, and jump suppression.
8. [docs/INTERACTION_STATE_MACHINE.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/INTERACTION_STATE_MACHINE.md) — Formal 9-state transition matrix, event triggers, and strict safety invariants.
9. [docs/UX_AND_VISUAL_DESIGN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/UX_AND_VISUAL_DESIGN.md) — Aerospace CAD aesthetic, obsidian/amber/cyan tokens, monospace HUD, and fallback toolbar.
10. [docs/PERFORMANCE_PLAN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/PERFORMANCE_PLAN.md) — Target performance metrics, zero-allocation hot paths, and DevTools profiling protocols.
11. [docs/TEST_AND_EVALUATION_PLAN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/TEST_AND_EVALUATION_PLAN.md) — Vitest unit test suite, integration harnesses, and physical camera evaluation protocol.
12. [docs/SECURITY_PRIVACY_AND_LICENSING.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/SECURITY_PRIVACY_AND_LICENSING.md) — 100% client-side privacy model, MIT dependency audit, and aerospace disclaimers.
13. [docs/MODULE_IMPLEMENTATION_PLAN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/MODULE_IMPLEMENTATION_PLAN.md) — Complete repository tree, module public interfaces, and dependency graph.
14. [docs/IMPLEMENTATION_ROADMAP.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/IMPLEMENTATION_ROADMAP.md) — 15-phase dependency-aware development roadmap with effort estimates and exit criteria.
15. [docs/RISK_REGISTER.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/RISK_REGISTER.md) — Qualitative $3 \times 3$ failure mode analysis, mitigation strategies, and verification rules.
16. [docs/PORTFOLIO_AND_RESEARCH_PLAN.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/PORTFOLIO_AND_RESEARCH_PLAN.md) — Portfolio framing, interview defense talking points, and academic research extensions.
17. [docs/IMPLEMENTATION_DECISIONS.md](file:///c:/Users/siddu/OneDrive/Desktop/New%20folder/docs/IMPLEMENTATION_DECISIONS.md) — Consolidated consensus summary of all architectural commitments.

---

## 3. High-Level Architecture & Interaction Flow

```
+--------------------------------------------------------------------------------------------------+
|                                    AERIS END-TO-END PIPELINE                                     |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
| [Webcam Video Stream] (640x480 @ 30/60 fps)                                                      |
|       |                                                                                          |
|       v                                                                                          |
| [MediaPipe HandLandmarker] (VIDEO mode, WASM/GPU delegate)                                       |
|       |                                                                                          |
|       v Raw 21 3D Landmarks                                                                      |
| [One-Euro Adaptive Filter] (f_c_min = 1.0 Hz, beta = 0.007)                                       |
|       |                                                                                          |
|       v Jitter-Free Coordinates                                                                  |
| [Biomechanical Feature Extractor]                                                                |
|       | - Palm scale: d_palm = ||P9 - P0||                                                       |
|       | - Normalized pinch ratio: r_pinch = ||P8 - P4|| / d_palm                                 |
|       | - Finger curl angles: dot(v_prox, v_dist) for all 5 digits                               |
|       v                                                                                          |
| [Deterministic Rule Classifier] -> [Hysteresis (0.22/0.35) + 3-Frame Debounce]                   |
|       |                                                                                          |
|       v Stabilized Pose Intent (PINCH, POINT, OPEN_PALM, FIST, NEUTRAL)                          |
| [Interaction State Machine (FSM)]                                                                |
|       | - States: IDLE, TRACKING, CANDIDATE, CONFIRMED, MANIPULATING, LOST, RECOVERY             |
|       | - Enforces zero drift on tracking loss; suppresses jump discontinuities on recovery      |
|       v                                                                                          |
| [Action Dispatcher]                                                                              |
|       |                                                                                          |
|       +---------------------------------------------+                                            |
|       | Dispatched Scene Actions                    | Synchronized State                         |
|       v                                             v                                            |
| [Three.js Scene Graph Engine]             [React Aerospace HUD & Diagnostics]                    |
|   - 8-Stage Procedural Turbofan             - Live PIP Webcam + Landmark Skeleton                |
|   - Instanced Blade Rings (<20 draw calls)  - Monospace Telemetry (FPS, Inference ms)           |
|   - Exploded-View Axial Displacement        - Component Dossier (Specifications)                 |
|   - Outline Emissive Raycaster              - Keyboard/Mouse Fallback Toolbar                    |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 4. First Implementation Milestone: The Vertical Slice

The initial coding objective will not build decorative UI. It will implement and verify **Milestone 1: The First End-to-End Vertical Slice**:

```
[Real Webcam Frame] 
      -> [MediaPipe Hand Landmark Extraction]
      -> [Scale-Invariant Pinch Classification]
      -> [Interaction State Machine (IDLE -> TRACKING -> MANIPULATING)]
      -> [Smooth Three.js Procedural Engine Rotation]
      -> [Pinch Release -> Clean Inertial Damping]
      -> [Tracking Loss Simulation -> Zero Transform Jump Guarantee]
```

Once this vertical slice is physically executed and confirmed in the browser, secondary capabilities (component targeting raycasting, spatial zoom, multi-axis exploded view, and the technical HUD) will be constructed on this verified foundation.

---

## 5. Approval Gate & Next Step

All planning investigations, architecture contracts, and engineering specifications are complete. 

**Execution is halted. I am awaiting your explicit authorization to begin Phase 2 (Project Setup & Foundational Scaffolding).**
