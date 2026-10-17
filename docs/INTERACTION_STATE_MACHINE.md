# AERIS — Interaction State Machine Specification
**Document ID:** AERIS-DOC-008  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. State Machine Topology

The AERIS Interaction Engine is governed by a deterministic Finite State Machine (FSM). It guarantees that user intents are disambiguated, commands cannot flicker, and loss of camera tracking safely freezes scene state without transform drift.

```
+--------------------------------------------------------------------------------------------------+
|                                    INTERACTION FSM TOPOLOGY                                      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|             +-----------------------------------------------------------------------+            |
|             |                                                                       |            |
|             v                                                                       |            |
|       +-----------+       HAND_DETECTED                                             |            |
|       |   IDLE    | ------------------------> +----------------+                        |            |
|       +-----------+                           |    TRACKING    | <------------------+   |            |
|             ^                                 +----------------+                    |   |            |
|             |                                         |                             |   |            |
|             | NO_HAND_TIMEOUT                         | CANDIDATE_POSE_DETECTED     |   |            |
|             |                                         v                             |   |            |
|             |                             +------------------------+                |   |            |
|             |                             |   GESTURE_CANDIDATE    |                |   |            |
|             |                             +------------------------+                |   |            |
|             |                                         |                             |   |            |
|             |                                         | DEBOUNCE_CONFIRMED (N >= 3) |   |            |
|             |                                         v                             |   |            |
|             |                             +------------------------+                |   |            |
|             |                             |   GESTURE_CONFIRMED    |                |   |            |
|             |                             +------------------------+                |   |            |
|             |                                         |                             |   |            |
|             |                   +---------------------+-----------------------+     |   |            |
|             |                   |                     |                       |     |   |            |
|             |                   v (Pinch)             v (Point)               v     |   |            |
|             |          +------------------+  +---------------------+  (Open Palm)   |   |            |
|             |          |  MANIPULATING_   |  | COMPONENT_TARGETING |  TOGGLE_       |   |            |
|             |          |     ROTATION     |  +---------------------+  EXPLODE       |   |            |
|             |          +------------------+           |                             |   |            |
|             |                   |                     | PINCH_ON_TARGET             |   |            |
|             |                   |                     v                             |   |            |
|             |                   |            +---------------------+                |   |            |
|             |                   |            |   OBJECT_SELECTED   |                |   |            |
|             |                   |            +---------------------+                |   |            |
|             |                   |                     |                             |   |            |
|             |                   +----------+----------+                             |   |            |
|             |                              |                                        |   |            |
|             |                              | TRACKING_DROPPED                       |   |            |
|             |                              v                                        |   |            |
|             |                    +-------------------+                              |   |            |
|             |                    |   TRACKING_LOST   |                              |   |            |
|             |                    +-------------------+                              |   |            |
|             |                              |                                        |   |            |
|             |                              | HAND_REACQUIRED                        |   |            |
|             |                              v                                        |   |            |
|             |                    +-------------------+                              |   |            |
|             |                    |     RECOVERY      | -----------------------------+   |            |
|             |                    +-------------------+                                  |            |
|             |                              |                                            |            |
|             +------------------------------+--------------------------------------------+            |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. State Transition Matrix

| Source State | Event Trigger | Guard Condition | Target State | Entry / Action Executed | Exit / Cleanup Action |
|---|---|---|---|---|---|
| **`IDLE`** | `HAND_DETECTED` | Valid landmarks present; confidence $\ge 0.65$ | **`TRACKING`** | Initialize landmark history; reset anchor coordinates. | None |
| **`TRACKING`** | `POSE_DETECTED` | Normalized pose matches `PINCH`, `POINT`, or `PALM` | **`GESTURE_CANDIDATE`** | Set candidate pose; start debounce frame counter ($N=1$). | None |
| **`TRACKING`** | `TRACKING_DROPPED` | Landmark count $= 0$ or confidence $< 0.50$ | **`IDLE`** | Emit fallback notice. | None |
| **`GESTURE_CANDIDATE`** | `FRAME_TICK` | Candidate pose matches across $N \ge 3$ frames | **`GESTURE_CONFIRMED`** | Lock confirmed gesture; emit telemetry state. | Reset frame counter. |
| **`GESTURE_CANDIDATE`** | `POSE_MISMATCH` | Frame pose changes before $N=3$ | **`TRACKING`** | Cancel candidate; log spurious noise event. | None |
| **`GESTURE_CONFIRMED`** | `DISPATCH_GESTURE` | Pose is `PINCH` and targeting is inactive | **`MANIPULATING_ROTATION`**| Capture anchor $(x_0, y_0)$; dispatch `BEGIN_GRAB`. | None |
| **`GESTURE_CONFIRMED`** | `DISPATCH_GESTURE` | Pose is `POINT` | **`COMPONENT_TARGETING`** | Enable spatial cursor raycaster; emit `START_TARGETING`. | Hide cursor ray. |
| **`GESTURE_CONFIRMED`** | `DISPATCH_GESTURE` | Pose is `OPEN_PALM` | **`TRACKING`** | Dispatch `TOGGLE_EXPLODE_VIEW`; trigger cooldown timer. | None |
| **`MANIPULATING_ROTATION`**| `HAND_MOVED` | Pinch maintained ($r_{\text{pinch}} < 0.35$) | **`MANIPULATING_ROTATION`**| Calculate $(\Delta x, \Delta y)$; dispatch `UPDATE_ROTATION`. | None |
| **`MANIPULATING_ROTATION`**| `PINCH_RELEASED`| $r_{\text{pinch}} \ge 0.35$ | **`TRACKING`** | Dispatch `END_GRAB`; apply smooth rotational damping. | Clear anchor. |
| **`MANIPULATING_ROTATION`**| `TRACKING_DROPPED`| Frame dropout | **`TRACKING_LOST`** | Dispatch `SUSPEND_MANIPULATION`; clamp $\Delta = 0$. | Freeze state. |
| **`COMPONENT_TARGETING`**| `PINCH_CONFIRMED` | Raycaster intersects a valid component | **`OBJECT_SELECTED`** | Dispatch `SELECT_COMPONENT(id)`; open HUD dossier. | Pulse highlight. |
| **`OBJECT_SELECTED`** | `POINT_BACKGROUND`| Raycaster intersects empty space | **`TRACKING`** | Dispatch `CLEAR_SELECTION`; close HUD dossier. | Clear outline. |
| **`TRACKING_LOST`** | `HAND_REACQUIRED` | Landmarks valid for 2 consecutive frames | **`RECOVERY`** | Reset anchor to current coordinates without delta computation. | Clear stale flag. |
| **`RECOVERY`** | `STABILIZED` | One-Euro filter initialized | **`TRACKING`** | Resume normal interaction; log successful recovery. | None |
| **`ANY_STATE`** | `RESET_TRIGGERED`| Keyboard 'R' pressed or Reset button clicked | **`IDLE`** | Dispatch `RESET_SCENE_TRANSFORMS`; reset exploded view to 0. | Flush buffers. |

---

## 3. Strict State Invariants

The FSM guarantees that the following safety invariants can never be violated:

1. **No Phantom Manipulation:**  
   If no hand is detected (`TRACKING_LOST` or `IDLE`), the scene rotation delta $\Delta(\text{yaw}, \text{pitch})$ is strictly guaranteed to be zero. No continuous spinning or runaway transform occurs.
2. **Jump Discontinuity Prevention:**  
   When transitioning from `TRACKING_LOST` $\to$ `RECOVERY` $\to$ `TRACKING`, the first post-recovery frame is forced to calibrate anchor coordinates. Delta calculation is skipped, ensuring the engine model does not violently snap.
3. **Exploded View Idempotency:**  
   The exploded-view animation operates on an absolute interpolation scalar $\lambda \in [0.0, 1.0]$. Repeated activations transition between 0.0 and 1.0 without accumulating unbounded offset drift.
4. **Independent Testability:**  
   The FSM is implemented as a pure TypeScript state machine with no React, DOM, or WebGL imports. It is 100% unit-testable using mock event sequences.
