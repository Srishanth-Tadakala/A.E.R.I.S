# AERIS — User Experience & Visual Design Specification
**Document ID:** AERIS-DOC-009  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Visual Design Philosophy & Aerospace Aesthetic

AERIS is designed as an aerospace spatial engineering console. It deliberately rejects consumer marketing tropes (hero banners, decorative cards, pseudo-scientific animated charts) in favor of functional CAD/PLM ergonomics inspired by aerospace flight test consoles and the technical holographic wireframe aesthetic in the reference imagery.

```
+--------------------------------------------------------------------------------------------------+
|                                    AERIS WORKSPACE LAYOUT                                        |
+--------------------------------------------------------------------------------------------------+
| [ AERIS // SPATIAL ENGINE CONSOLE ]     [ Vision: ACTIVE (60fps) ]   [ Mode: CAD WIREFRAME ] [?] |
|--------------------------------------------------------------------------------------------------|
|                                                                                                  |
|   +----------------------------------------------------------------------+  +----------------+   |
|   |  MAIN 3D VIEWPORT                                                    |  | COMPONENT      |   |
|   |                                                                      |  | INSPECTION     |   |
|   |                                  (Procedural Turbofan Assembly)      |  | DOSSIER        |   |
|   |                                                                      |  |                |   |
|   |                         * * * *                                      |  | Stage:         |   |
|   |                       *         *                                    |  | FAN ROTOR      |   |
|   |                      *  ( )===   *                                   |  |                |   |
|   |                       *         *                                    |  | Alloy:         |   |
|   |                         * * * *                                      |  | Ti-6Al-4V      |   |
|   |                                                                      |  |                |   |
|   |                                                                      |  | Pressure Ratio:|   |
|   |                                                                      |  | 1.65:1         |   |
|   |                                                                      |  |                |   |
|   |  [ Reticle Cursor ]                                                  |  | RPM (Design):  |   |
|   |                                                                      |  | 2,850 RPM      |   |
|   +----------------------------------------------------------------------+  +----------------+   |
|                                                                                                  |
|   +-------------------------+  +-----------------------------------------+  +----------------+   |
|   | LIVE VISION MONITOR     |  | SPATIAL TELEMETRY STRIP                 |  | FALLBACK /     |   |
|   | [ PIP Webcam Feed ]     |  | State: MANIPULATING_ROTATION            |  | QUICK CONTROLS |   |
|   | [ Landmark Skeleton ]   |  | Active Gesture: PINCH (r=0.18)          |  | [Reset View]   |   |
|   | Hand: PRIMARY (R)       |  | Render: 60 FPS | Inference: 14.2 ms     |  | [Explode View] |   |
|   +-------------------------+  +-----------------------------------------+  +----------------+   |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Design System & Design Tokens

### 2.1 Color Tokens
```css
:root {
  /* Surface & Background */
  --aeris-bg-space: #07080a;        /* Deep obsidian workspace background */
  --aeris-bg-surface: #0e1117;      /* Primary pane & HUD background */
  --aeris-bg-surface-elevated: #161a23; /* Popover, dossier, & modal background */
  --aeris-border-subtle: #212634;   /* Structural grid & pane divider lines */
  --aeris-border-active: #3b4254;   /* Focused or active pane borders */

  /* Aerospace Technical Accents */
  --aeris-accent-amber: #ff7a00;    /* Primary interaction trigger & warning accent */
  --aeris-accent-amber-glow: rgba(255, 122, 0, 0.25);
  --aeris-accent-cyan: #00e5ff;     /* Telemetry, spatial cursors, & active metrics */
  --aeris-accent-cyan-glow: rgba(0, 229, 255, 0.20);
  --aeris-accent-emerald: #00e676;  /* Confirmed state & healthy tracking indicator */
  --aeris-accent-crimson: #ff1744;  /* Tracking lost, camera denied, or fault state */

  /* Technical Typography */
  --aeris-text-primary: #f0f3f8;    /* High-contrast labels & readouts */
  --aeris-text-secondary: #8b949e;  /* Secondary engineering dimensions & metadata */
  --aeris-text-muted: #4e5666;      /* Unit symbols, inactive indicators, grid text */
}
```

### 2.2 Typography
- **Monospace Telemetry Font:** `JetBrains Mono`, `Space Mono`, or `ui-monospace`.
  - Used for coordinate readouts, FPS, inference latency, FSM state names, and aerospace engineering specs.
- **Interface Font:** `Inter`, `system-ui`, or `sans-serif`.
  - Used for button labels, modal instructions, and dossier section headers.

---

## 3. UI Panes & Functional Controls

### 3.1 Live Vision Monitor (Picture-in-Picture)
- Positioned in bottom-left or collapsible corner drawer.
- Displays scaled webcam feed ($160 \times 120$ or $240 \times 180$ px).
- Renders real-time 2D landmark skeleton overlay (green lines connecting joints, cyan points on fingertips, amber highlight on active pinch digits).
- Displays primary hand status and tracking confidence gauge.

### 3.2 Contextual Component Dossier (Inspection Drawer)
- Slides in from the right edge upon component selection.
- Displays simulated aerospace technical specifications bound to the selected `ComponentId`:
  - Component Title & Subsystem Class.
  - Operating Temperature Range.
  - Stage Pressure Ratio.
  - Structural Material Alloy.
  - Visual RPM / Rotation Coupling Spool.
  - "Procedural CAD Approximation" provenance badge.

### 3.3 Keyboard & Mouse Fallback Toolbar
- Positioned at bottom-right or top toolbar.
- Buttons for:
  - **Reset View (`KeyR`):** Restores camera to default isometric framing and resets rotation.
  - **Explode Engine (`KeyE`):** Toggles axial exploded-view expansion.
  - **Render Mode (`KeyM`):** Toggles between CAD Wireframe and PBR Metallic modes.
  - **Camera Engage (`KeyC`):** Explicitly toggles webcam tracking on/off.
- Standard mouse interaction: Click-drag orbits scene; scroll wheel zooms; click selects components.

---

## 4. Accessibility & Responsive Degradation

1. **Reduced Motion Compliance (`prefers-reduced-motion`):**  
   Disables automatic cinematic orbiting and snaps exploded view instantly without smooth interpolation if user prefers reduced motion.
2. **Graceful Camera Denial State:**  
   If the user denies camera permission or has no webcam:
   - The UI does not crash or display a blocking blank screen.
   - A concise notification banner informs: *"Camera access inactive. AERIS is operating in Precision Mouse & Keyboard Fallback Mode."*
   - All spatial features remain 100% accessible via OrbitControls and click selection.
