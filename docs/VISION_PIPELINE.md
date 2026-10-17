# AERIS — Computer Vision Pipeline Specification
**Document ID:** AERIS-DOC-005  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Vision Subsystem Scope & Constraints

The vision subsystem is responsible for real-time video capture, camera permission management, and extraction of 21 3D hand landmarks via Google MediaPipe Tasks Vision.

### Strict Operational Constraints
1. **Local Inference Guarantee:** All computer-vision inference runs 100% locally on the client device via WebAssembly / WebGL. No video frames, image data, or telemetry are ever transmitted over a network.
2. **Explicit User Activation:** The camera is never engaged automatically on page load. It activates solely upon deliberate user action (clicking "Engage Vision" or selecting a camera device).
3. **Hardware Cleanliness:** When the user pauses or closes the vision monitor, camera tracks are immediately stopped, extinguishing the hardware camera activity LED.

---

## 2. Camera Stream Lifecycle Management

The `cameraService.ts` module manages a deterministic state machine for browser camera access:

```
+--------------------------------------------------------------------------------------------------+
|                                    CAMERA SERVICE LIFECYCLE                                      |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +--------------------+                                                                         |
|   |    UNINITIALIZED   |                                                                         |
|   +--------------------+                                                                         |
|             |                                                                                    |
|             | user clicks "Engage Vision"                                                        |
|             v                                                                                    |
|   +--------------------+  navigator.mediaDevices.getUserMedia()                                 |
|   |     REQUESTING     | -------------------------------------+                                  |
|   +--------------------+                                      |                                  |
|             |                                                 | Permission Denied                |
|             | Permission Granted                              | / Hardware Error                 |
|             v                                                 v                                  |
|   +--------------------+                            +--------------------+                       |
|   |     STREAMING      |                            |     ERROR / DENIED |                       |
|   +--------------------+                            +--------------------+                       |
|             |                                                 |                                  |
|             | user toggles OFF / component unmount            | user retry                       |
|             v                                                 v                                  |
|   +--------------------+                                      |                                  |
|   |    DISCONNECTING   | -------------------------------------+                                  |
|   | - stop all tracks  |                                                                         |
|   | - release elements |                                                                         |
|   +--------------------+                                                                         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### Video Stream Constraints
```typescript
export const CAMERA_CONFIG = {
  video: {
    width: { ideal: 640, min: 480 },
    height: { ideal: 480, min: 360 },
    frameRate: { ideal: 60, min: 30 },
    facingMode: 'user'
  },
  audio: false // Explicitly disable audio capture
} as const;
```

---

## 3. MediaPipe Tasks Vision Integration

### 3.1 Initialization Sequence
1. **Wasm Asset Resolution:**
   ```typescript
   import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

   const visionWasm = await FilesetResolver.forVisionTasks(
     '/wasm' // Hosted locally in public directory for air-gapped reliability
   );
   ```
2. **HandLandmarker Instantiation:**
   ```typescript
   const handLandmarker = await HandLandmarker.createFromOptions(visionWasm, {
     baseOptions: {
       modelAssetPath: '/models/hand_landmarker.task',
       delegate: 'GPU' // Falls back gracefully to 'CPU' if WebGL is constrained
     },
     runningMode: 'VIDEO',
     numHands: 2, // Track up to 2 hands; primary hand arbitrated downstream
     minHandDetectionConfidence: 0.65,
     minHandPresenceConfidence: 0.65,
     minTrackingConfidence: 0.60
   });
   ```

### 3.2 Frame Processing Loop
Frames are processed synchronously against video arrival using either `HTMLVideoElement.requestVideoFrameCallback()` (in Chromium browsers) or a timestamp-throttled `requestAnimationFrame` loop:

```typescript
let lastVideoTime = -1;

function processVideoFrame(video: HTMLVideoElement, landmarker: HandLandmarker) {
  if (video.currentTime !== lastVideoTime && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    lastVideoTime = video.currentTime;
    const startTimeMs = performance.now();
    
    // Detect landmarks for the video frame at the current timestamp
    const result = landmarker.detectForVideo(video, startTimeMs);
    const inferenceDurationMs = performance.now() - startTimeMs;
    
    handleInferenceResult(result, inferenceDurationMs);
  }
}
```

---

## 4. Landmark Anatomy & Coordinate Systems

MediaPipe outputs 21 landmarks per detected hand.

```
       Landmark Topology Reference:
       
             8 (Index Tip)    12 (Middle Tip)   16 (Ring Tip)   20 (Pinky Tip)
             |                 |                 |               |
             7                 11                15              19
             |                 |                 |               |
             6                 10                14              18
             |                 |                 |               |
             5 (Index MCP)-----9 (Middle MCP)---13 (Ring MCP)---17 (Pinky MCP)
             \                                                 /
    4 (Thumb) \                                               /
        \      \                                             /
         3      \                                           /
          \      \                                         /
           2      \                                       /
            \      \                                     /
             1------0 (Wrist)---------------------------/
```

### Coordinate Space Definitions
1. **Normalized Image Coordinates (`landmarks[i]`):**
   - $x \in [0.0, 1.0]$: Horizontal position from left to right edge of camera frame.
   - $y \in [0.0, 1.0]$: Vertical position from top to bottom edge of camera frame.
   - $z$: Relative depth roughly scaled to hand size (negative is closer to camera).
2. **Camera Mirroring Normalization:**
   - Because standard user-facing webcams act as mirrors, raw $x$ is flipped:
     $$x_{\text{mirrored}} = 1.0 - x_{\text{raw}}$$
   - Moving the physical hand rightward immediately moves the virtual cursor rightward.
3. **World Landmarks (`worldLandmarks[i]`):**
   - Metric coordinates in meters $(X, Y, Z)$ centered at the hand's geometric root. Used for scale-invariant angular calculations.

---

## 5. Landmark Validation & Quality Assurance

Not every MediaPipe output frame represents a usable hand pose. Raw landmarks undergo strict validation before passing to the gesture layer:

1. **Detection Quality Check:**
   - Ensure `result.landmarks.length > 0` and array contains exactly 21 valid non-NaN coordinates.
2. **Boundary Proximity Check:**
   - If any core landmark ($P_0, P_5, P_9, P_{17}$) falls within $2\%$ of frame boundaries ($x < 0.02$, $x > 0.98$, $y < 0.02$, $y > 0.98$), the hand is marked as `MARGINAL_TRACKING`. This prevents spurious gestures when fingertips are cropped outside the camera FOV.
3. **Velocity Clamping / Anomaly Detection:**
   - If the Euclidean distance between consecutive frame wrist positions $\|P_0(t) - P_0(t - \Delta t)\|$ exceeds an anatomically impossible speed threshold ($> 0.4$ frame units in $< 33$ ms), the frame is rejected as a tracking anomaly.

---

## 6. Multi-Hand Arbitration Strategy

When two hands enter the camera frame:
- **Primary Hand Selection:** The hand with the highest tracking presence confidence and nearest center alignment is designated the **Primary Hand** (driving rotation, selection, and zoom).
- **Secondary Hand Designation:** The second hand is designated the **Auxiliary Hand** (available for future two-handed zoom / explode expansion).
- If the primary hand drops out of tracking, the secondary hand does **not** instantly steal control to prevent unintended sudden manipulation. A 300 ms debounce transition is enforced.

---

## 7. Tracking Loss & Clean Resource Deallocation

### Tracking-Loss Event Handling
When `result.landmarks.length === 0`:
1. The vision layer immediately emits a `TRACKING_LOST` event with a zero-velocity delta.
2. The interaction layer suppresses any active drag, clamping rotational inertia to zero.
3. When tracking resumes, the first frame is marked `ANCHOR_RESET`, forcing downstream manipulators to establish fresh baseline coordinates rather than calculating a delta from the pre-loss position.

### Teardown Routine
```typescript
export function stopCameraStream(stream: MediaStream | null, videoElement: HTMLVideoElement | null) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop(); // Hardware LED off
    });
  }
  if (videoElement) {
    videoElement.srcObject = null;
  }
}
```
