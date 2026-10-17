# AERIS — Gesture Recognition & Biomechanical Feature Specification
**Document ID:** AERIS-DOC-006  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Gesture Vocabulary & Interaction Classification

AERIS defines an explicit vocabulary of discrete triggers and continuous spatial interactions.

| Gesture Identifier | Interaction Nature | Primary Application Action | Trigger Condition |
|---|---|---|---|
| **`PINCH_START`** | Discrete Edge | Enters Grab / Selection Mode | Thumb tip touches Index tip ($\le \theta_{\text{enter}}$) |
| **`PINCH_ACTIVE`** | Continuous State | Sustains Grasp Anchor | Separation remains within hysteresis band |
| **`PINCH_MOVE`** | Continuous Stream | Rotates 3D Engine or Drags Component | Hand centroid translates while `PINCH_ACTIVE` |
| **`PINCH_RELEASE`** | Discrete Edge | Releases Grasp / Commits Selection | Separation exceeds release threshold ($\ge \theta_{\text{exit}}$) |
| **`POINT`** | Continuous Stream | Raycasts Spatial Targeting Cursor | Index fully extended; Middle, Ring, Pinky curled |
| **`OPEN_PALM`** | Discrete / State | Toggles Exploded View / Menu | All 5 fingers extended; Palm normal facing camera |
| **`FIST`** | Discrete / State | Emergency Pause / Freeze Transforms | All 5 fingers curled; Thumb tucked |
| **`NEUTRAL`** | Rest State | Default Idling | Relaxed open hand; no specific triggers met |
| **`TRACKING_LOST`** | System Signal | Clamps Velocities; Suspends Transforms | Hand absent or confidence $< 0.60$ |

---

## 2. Mathematical Feature Formulations

To ensure robust operation across different hand sizes, camera distances, and camera focal lengths, all measurements are computed in **scale-invariant biomechanical ratios**.

### 2.1 Palm Reference Metric ($d_{\text{palm}}$)
The distance between the wrist ($P_0$) and middle-finger metacarpophalangeal joint ($P_9$) serves as the anatomical scaling baseline:
$$d_{\text{palm}} = \|\mathbf{P}_9 - \mathbf{P}_0\|_2 = \sqrt{(x_9 - x_0)^2 + (y_9 - y_0)^2 + (z_9 - z_0)^2}$$

### 2.2 Normalized Pinch Metric ($r_{\text{pinch}}$)
The Euclidean separation between the thumb tip ($P_4$) and index fingertip ($P_8$) divided by $d_{\text{palm}}$:
$$r_{\text{pinch}} = \frac{\|\mathbf{P}_4 - \mathbf{P}_8\|_2}{d_{\text{palm}}}$$

### 2.3 Finger Curl & Extension State ($\kappa_{\text{finger}}$)
For each digit $f \in \{\text{Thumb}, \text{Index}, \text{Middle}, \text{Ring}, \text{Pinky}\}$, extension is computed via the cosine of the angle between proximal and distal segments:
$$\mathbf{v}_{\text{prox}} = \mathbf{P}_{\text{pip}} - \mathbf{P}_{\text{mcp}}, \quad \mathbf{v}_{\text{dist}} = \mathbf{P}_{\text{tip}} - \mathbf{P}_{\text{pip}}$$
$$\cos \theta_f = \frac{\mathbf{v}_{\text{prox}} \cdot \mathbf{v}_{\text{dist}}}{\|\mathbf{v}_{\text{prox}}\| \|\mathbf{v}_{\text{dist}}\|}$$
- **Extended:** $\cos \theta_f > 0.70$ (angle $< 45^\circ$) and $\|\mathbf{P}_{\text{tip}} - \mathbf{P}_0\| > \|\mathbf{P}_{\text{pip}} - \mathbf{P}_0\|$.
- **Curled:** $\cos \theta_f < 0.20$ (angle $> 78^\circ$) and $\|\mathbf{P}_{\text{tip}} - \mathbf{P}_0\| < \|\mathbf{P}_{\text{pip}} - \mathbf{P}_0\|$.

### 2.4 Palm Normal Vector ($\mathbf{n}_{\text{palm}}$)
Determines whether the palm is facing the user, camera, or edge-on:
$$\mathbf{v}_{\text{index\_mcp}} = \mathbf{P}_5 - \mathbf{P}_0, \quad \mathbf{v}_{\text{pinky\_mcp}} = \mathbf{P}_{17} - \mathbf{P}_0$$
$$\mathbf{n}_{\text{palm}} = \frac{\mathbf{v}_{\text{index\_mcp}} \times \mathbf{v}_{\text{pinky\_mcp}}}{\|\mathbf{v}_{\text{index\_mcp}} \times \mathbf{v}_{\text{pinky\_mcp}}\|}$$
- If $\mathbf{n}_{\text{palm}} \cdot (0, 0, 1) < -0.65$, the palm directly faces the camera (qualifies for `OPEN_PALM`).

---

## 3. Coordinate Smoothing: The One-Euro ($\text{1€}$) Filter

Raw landmark coordinates undergo real-time temporal low-pass filtering using the One-Euro filter (Casiez et al., 2012) to eradicate jitter during stationary poses without lagging behind quick hand motions.

### Formulation
For coordinate $X_i$ at time $t_i$ with time interval $T_e = t_i - t_{i-1}$:

1. **Filtered Velocity ($\dot{\hat{X}}_i$):**
   $$\dot{X}_i = \frac{X_i - \hat{X}_{i-1}}{T_e}$$
   $$\dot{\hat{X}}_i = \alpha_d \dot{X}_i + (1 - \alpha_d) \dot{\hat{X}}_{i-1}, \quad \text{where } \alpha_d = \frac{1}{1 + \frac{1}{2\pi f_{c\_deriv} T_e}}$$

2. **Dynamic Cutoff Frequency ($f_c$):**
   $$f_c = f_{c\_min} + \beta |\dot{\hat{X}}_i|$$

3. **Filtered Coordinate ($\hat{X}_i$):**
   $$\hat{X}_i = \alpha X_i + (1 - \alpha) \hat{X}_{i-1}, \quad \text{where } \alpha = \frac{1}{1 + \frac{1}{2\pi f_c T_e}}$$

### Default Calibrated Parameters
- **$f_{c\_min} = 1.0 \text{ Hz}$:** Low cutoff when speed is near zero $\to$ completely eliminates visual trembling during delicate pointing.
- **$\beta = 0.007$:** Speed coefficient $\to$ increases cutoff smoothly during rapid sweeps, keeping phase lag $< 12$ ms.
- **$f_{c\_deriv} = 1.0 \text{ Hz}$:** Derivative cutoff frequency for stable velocity estimation.

---

## 4. Hysteresis & Temporal Debouncing

To prevent high-frequency toggling ("flicker") when hand metrics hover near boundary thresholds, two layers of stabilization are applied:

```
+--------------------------------------------------------------------------------------------------+
|                                    HYSTERESIS SCHMITT TRIGGER                                    |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   Normalized Pinch Ratio (r_pinch)                                                               |
|                                                                                                  |
|   r > 0.35  ---------------------------------------------------> [ STATE: RELEASED / NEUTRAL ]  |
|                                     ^                                          |                 |
|                                     | Exit Threshold (0.35)                    |                 |
|                            HYSTERESIS DEAD-BAND                                |                 |
|                                     |                                          | Enter Threshold |
|                                     |                                          v (0.22)          |
|   r < 0.22  ---------------------------------------------------> [ STATE: PINCH_ACTIVE ]      |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 4.1 Hysteresis Thresholds
- **Pinch Enter:** $r_{\text{pinch}} \le 0.22$
- **Pinch Exit:** $r_{\text{pinch}} \ge 0.35$
- **Dead-Band:** $0.22 < r_{\text{pinch}} < 0.35$ (maintains previous state).

### 4.2 Temporal Debounce Counter
- Any discrete candidate pose (`OPEN_PALM`, `FIST`, `POINT`) must persist across **$N = 3$ consecutive valid frames** ($\approx 50$–100 ms) before triggering a state change in the interaction engine.
- A single erroneous frame from camera motion blur or partial occlusion will not cause unintended command execution.

---

## 5. Experimental Calibration Protocol & Evaluation Metrics

The precision and reliability of the gesture classifier will be evaluated via a repeatable protocol using real camera input under varied conditions (ambient light, hand distance 0.4m–1.2m, and hand angles).

### Evaluation Metrics (Formulated Mathematically)
1. **Gesture Precision ($P_g$):**
   $$P_g = \frac{\text{True Activations of Gesture } g}{\text{True Activations } g + \text{False Activations } g}$$
2. **Gesture Recall ($R_g$):**
   $$R_g = \frac{\text{True Activations of Gesture } g}{\text{Intended Target Activations of } g}$$
3. **False Activation Rate ($\text{FAR}$):**
   $$\text{FAR} = \frac{\text{Unintended Activations}}{\text{Total Interaction Time (Minutes)}}$$
4. **End-to-End Gesture Latency ($L_{\text{e2e}}$):**
   $$L_{\text{e2e}} = t_{\text{visual\_scene\_mutation}} - t_{\text{physical\_contact\_onset}}$$

*Note: All accuracy claims in the final project report will be substantiated by empirical measurements derived from this protocol.*
