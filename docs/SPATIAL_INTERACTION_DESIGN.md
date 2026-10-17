# AERIS — Spatial Interaction & Coordinate Mapping Design
**Document ID:** AERIS-DOC-007  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Coordinate Space Reference & Transformations

Spatial interaction requires mapping continuous 2D/3D tracking inputs across multiple geometric coordinate systems without distortion or discontinuity.

```
+--------------------------------------------------------------------------------------------------+
|                                    COORDINATE PIPELINE FLOW                                      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   [ Webcam Raw Frame ]                                                                           |
|   - Pixel dimensions: W x H (e.g. 640 x 480)                                                     |
|            |                                                                                     |
|            v                                                                                     |
|   [ MediaPipe Normalized Image Coordinates (NIC) ]                                               |
|   - x_raw in [0.0, 1.0], y_raw in [0.0, 1.0]                                                     |
|   - Origin: Top-Left corner                                                                      |
|            |                                                                                     |
|            v  Mirroring: x_m = 1.0 - x_raw                                                       |
|   [ Mirrored Normalized Coordinates ]                                                            |
|            |                                                                                     |
|            +---------------------------------+----------------------------------+                |
|            |                                                                    |                |
|            v (Viewport Screen Space)                                            v (Three.js NDC) |
|   [ Screen Coordinates (CSS px) ]                                     [ Normalized Device Coord] |
|   - x_px = x_m * window.innerWidth                                    - x_ndc = (x_m * 2) - 1.0  |
|   - y_px = y_raw * window.innerHeight                                 - y_ndc = -(y_raw * 2) + 1|
|   - Drives 2D HUD Cursor / Reticle                                    - Drives 3D Raycasting     |
|                                                                                 |                |
|                                                                                 v                |
|                                                                       [ Three.js World Ray ]     |
|                                                                       - Raycaster.setFromCamera  |
|                                                                       - Intersects 3D Mesh Graph |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Mathematical Coordinate Conversions

### 2.1 Normalized Image Space to Normalized Device Coordinates (NDC)
MediaPipe image coordinates span $[0, 1]$ with origin at top-left. Three.js NDC spans $[-1, 1]$ with origin at viewport center and positive $Y$ pointing upwards:
$$x_{\text{ndc}} = (1.0 - x_{\text{raw}}) \times 2.0 - 1.0$$
$$y_{\text{ndc}} = -(y_{\text{raw}} \times 2.0 - 1.0) = 1.0 - 2.0 \cdot y_{\text{raw}}$$

### 2.2 Pointing Ray Projection & Raycasting
When the interaction state is `COMPONENT_TARGETING` (pointing gesture confirmed):
1. The smoothed position of the index fingertip ($P_8$) is converted to $(x_{\text{ndc}}, y_{\text{ndc}})$.
2. The Three.js `THREE.Raycaster` is parameterized:
   ```typescript
   raycaster.setFromCamera(new THREE.Vector2(x_ndc, y_ndc), camera);
   const intersects = raycaster.intersectObjects(selectableMeshes, true);
   ```
3. The nearest valid intersection is resolved to its canonical `ComponentId` via the parent hierarchy crawler described in the Shared Component Registry.

---

## 3. Spatial Manipulation Mechanics

### 3.1 Continuous Orbit Rotation (Pinch-and-Drag)
Model rotation is driven by the spatial displacement of the hand centroid while in `MANIPULATING_ROTATION` state.

1. **Anchor Acquisition:**  
   Upon `PINCH_START`, the current mirrored hand position is captured as the reference anchor:
   $$\mathbf{A}_0 = (x_{m, 0}, y_{0})$$
2. **Delta Calculation:**  
   On each subsequent frame $t$:
   $$\Delta x = x_{m, t} - x_{m, t-1}, \quad \Delta y = y_t - y_{t-1}$$
3. **Quaternion Rotation Formulation:**  
   To prevent Euler gimbal lock, transforms are integrated using rotational quaternions:
   $$q_{\text{yaw}} = \text{Quaternion}(\text{axis}=(0, 1, 0), \text{angle}=\Delta x \times S_{\text{rot}})$$
   $$q_{\text{pitch}} = \text{Quaternion}(\text{axis}=(1, 0, 0), \text{angle}=\Delta y \times S_{\text{rot}})$$
   $$\mathbf{Q}_{\text{model}}(t) = q_{\text{yaw}} \times q_{\text{pitch}} \times \mathbf{Q}_{\text{model}}(t-1)$$
   - Sensitivity factor $S_{\text{rot}} = 3.5 \text{ rad/unit}$ (user-adjustable via HUD settings).

### 3.2 Dynamic Zoom & Depth Scaling
1. **Method A (Pinch Separation):**  
   If the user executes a two-finger pinch-spread gesture, the change in separation drives camera distance:
   $$\Delta \text{dist} = (r_{\text{pinch}}(t) - r_{\text{pinch}}(t-1)) \times S_{\text{zoom}}$$
2. **Method B (Hand $Z$-Depth):**  
   Moving the entire hand physically closer to/farther from the camera shifts MediaPipe metric $z$ coordinate, dollying the Three.js camera along its view frustum vector.
3. **Clamping Bounds:**  
   Camera radius $R_{\text{cam}}$ is clamped to strict limits ($R_{\text{min}} = 2.0 \text{ m}$, $R_{\text{max}} = 10.0 \text{ m}$) to prevent clipping inside turbine shafts or losing the model in empty space.

---

## 4. Discontinuity Suppression & Tracking Recovery

A major flaw in naive spatial interaction systems is the **"Jump Discontinuity"**: when tracking drops while dragging and later resumes in a different part of the frame, a massive $\Delta(x, y)$ is calculated, spinning the 3D model uncontrollably.

AERIS prevents this via **Stateful Anchor Invalidation**:

```
[ Active Drag: Anchor A_t ] ---> [ Tracking Lost Frame ] 
                                          |
                                          v
                              [ Freeze In-Flight Delta = 0 ]
                              [ Set Anchor Stale Flag = TRUE ]
                                          |
                                          v
[ Tracking Resumed Frame ] <--------------+
         |
         v
Is Anchor Stale?
  -> YES: Overwrite Anchor A_0 = Current_Position
          Emit zero rotation delta for Frame 1
          Clear Stale Flag
          Resume normal dragging on Frame 2
```

This guarantees zero transform jumps upon hand re-entry.
