# AERIS — Test & Evaluation Plan
**Document ID:** AERIS-DOC-011  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Quality Assurance Strategy & Pyramid

AERIS implements a tiered testing pyramid combining deterministic unit assertions, integration pipelines, browser smoke verification, and an empirical real-camera evaluation protocol.

```
+--------------------------------------------------------------------------------------------------+
|                                        TESTING PYRAMID                                           |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|                             / \                                                                  |
|                            /   \       EMPIRICAL HUMAN EVALUATION                                |
|                           /     \      - Real Camera Protocol (Lighting, Distance, Latency)      |
|                          /-------\                                                               |
|                         /         \     BROWSER / DOM AUTOMATION                                 |
|                        /           \    - Canvas Rendering, Permission Denial, Fallback Controls |
|                       /-------------\                                                            |
|                      /               \   INTEGRATION TESTING                                     |
|                     /                 \  - Gesture-to-Action Dispatch, Component Selection       |
|                    /-------------------\                                                         |
|                   /                     \ UNIT TESTING (Vitest)                                  |
|                  /                       \ - Biomechanical Features, One-Euro, FSM, Coordinates  |
|                 +-------------------------+                                                      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Unit Testing Specification (Vitest)

Unit tests run in pure headless Node/V8 environments with zero browser or camera dependencies.

### 2.1 Biomechanical Feature & Gesture Classifier Tests (`tests/unit/gestures.test.ts`)
1. **Scale Invariance Verification:**
   - Feed synthetic hand landmark fixtures at scale $S = 0.5$, $S = 1.0$, and $S = 2.0$.
   - Assert normalized pinch ratio $r_{\text{pinch}} = \|P_4 - P_8\| / d_{\text{palm}}$ remains constant ($\pm 0.0001$).
2. **Pinch Pose Classification:**
   - Assert $r_{\text{pinch}} < 0.22$ triggers `PINCH_START`.
   - Assert $r_{\text{pinch}} = 0.28$ maintains current state (hysteresis band).
   - Assert $r_{\text{pinch}} > 0.35$ triggers `PINCH_RELEASE`.
3. **Pointing Pose Classification:**
   - Index extended ($\cos \theta > 0.70$), remaining fingers curled ($\cos \theta < 0.20$). Assert classified as `POINT`.
   - Relax middle finger slightly. Assert classified as `NEUTRAL` (avoids false-positive targeting).

### 2.2 Temporal Stabilization & Filter Tests (`tests/unit/stabilizer.test.ts`)
1. **One-Euro Filter Stationary Step Response:**
   - Inject stationary coordinates contaminated with Gaussian noise ($\sigma = 0.02$).
   - Assert filtered output standard deviation $\sigma_{\text{filtered}} < 0.003$ ($>85\%$ jitter attenuation).
2. **Dynamic Step Response & Latency:**
   - Inject instantaneous step transition from $x = 0.2 \to x = 0.8$.
   - Assert filter reaches $90\%$ of step value within $\le 3$ frames (no sluggish dragging).

### 2.3 Finite State Machine Tests (`tests/unit/fsm.test.ts`)
1. **Valid Transition Traversal:**
   - Test full sequence: `IDLE` $\to$ `TRACKING` $\to$ `CANDIDATE` $\to$ `CONFIRMED` $\to$ `MANIPULATING_ROTATION` $\to$ `TRACKING` $\to$ `IDLE`.
2. **Tracking-Loss Discontinuity Immunity:**
   - Trigger `TRACKING_DROPPED` during active `MANIPULATING_ROTATION`.
   - Assert FSM transitions to `TRACKING_LOST`.
   - Reintroduce hand with a large coordinate offset. Assert FSM transitions to `RECOVERY`, resets anchor, and outputs **zero** rotation delta.

### 2.4 Component Registry & Procedural Geometry Tests (`tests/unit/registry.test.ts`)
1. **Registry Completeness:**
   - Assert all 8 mechanical stages (`intake_spinner`, `fan_blades`, `lpc_booster`, `hpc_core`, `combustor`, `hpt_turbine`, `lpt_turbine`, `exhaust_nozzle`) have defined exploded offsets and valid metadata.
2. **Hierarchy Resolution Crawler:**
   - Create deeply nested child mesh inside `fan_blades` group.
   - Assert `resolveComponentFromIntersection(childMesh)` returns `"fan_blades"`.

---

## 3. Integration Testing Specification

1. **Gesture-to-Action Dispatch Integration:**
   - Simulate a continuous stream of pinch-and-move landmark fixtures.
   - Assert `actionDispatcher` emits sequence of `UPDATE_ROTATION` payloads with valid non-NaN quaternions.
2. **Exploded View Idempotency:**
   - Trigger `TOGGLE_EXPLODE_VIEW` 10 consecutive times.
   - Assert all component local transform offsets return to exactly $(0, 0, 0)$.
3. **Camera Teardown & Resource Cleanup:**
   - Mount camera service, acquire mock stream, trigger stop.
   - Assert all `MediaStreamTrack.stop()` spies are called and `srcObject` is cleared.

---

## 4. Browser Integration & Smoke Testing

Automated headless browser tests verify:
1. Canvas instantiation and WebGL context acquisition.
2. Initial scene rendering and default camera framing.
3. DOM fallback control clicks (`#btn-reset-view`, `#btn-explode`).
4. Camera denial banner presentation when `getUserMedia` throws `NotAllowedError`.

---

## 5. Real-Camera Empirical Evaluation Protocol

*Notice: This protocol evaluates physical interaction fidelity. Results must be gathered from actual physical experiments, never fabricated.*

### Test Setup Protocol
- **Test Subjects:** 2+ operators with varying hand geometries.
- **Illumination Conditions:**
  - Condition L1: Optimal diffused office lighting (400–600 lux).
  - Condition L2: Low ambient light (50–100 lux).
- **Physical Camera Distances:**
  - $D_1 = 0.4 \text{ m}$ (Close desk position).
  - $D_2 = 0.8 \text{ m}$ (Standard laptop distance).
  - $D_3 = 1.2 \text{ m}$ (Arm extended).

### Trial Script & Experimental Measurements
1. **Pinch Precision Trial:** Operator performs 20 intentional pinches and 20 neutral hand sweeps. Calculate:
   $$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}$$
2. **Interaction Latency Trial:** Record camera frame arrival timestamp and scene render timestamp. Compute average end-to-end latency in milliseconds.
3. **Recovery Time Trial:** Operator removes hand while dragging the model, waits 2 seconds, and re-enters frame. Record time to re-stabilize and verify absence of transform jumps.
