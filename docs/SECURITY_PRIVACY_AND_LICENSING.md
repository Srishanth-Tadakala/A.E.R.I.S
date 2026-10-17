# AERIS — Security, Privacy, and Licensing Specification
**Document ID:** AERIS-DOC-012  
**Status:** APPROVED FOR PLANNING  
**Date:** 2026-10-17  

---

## 1. Privacy Architecture & Video Frame Protection

Spatial computing applications utilizing camera feeds require strict privacy safeguards:

1. **Zero External Network Transmission:**  
   Every camera frame captured via `getUserMedia` is processed exclusively inside the browser's local WebAssembly / WebGL memory space. No video frames, image snapshots, landmark coordinates, or tracking telemetry are ever sent over a network.
2. **Local Asset Hosting:**  
   The MediaPipe WebAssembly binaries (`vision_wasm_internal.js`, `vision_wasm_internal.wasm`) and model bundle (`hand_landmarker.task`) are hosted locally in the project's `/public/` directory, allowing the entire application to operate air-gapped without external network calls.
3. **Explicit Consent & Camera Stream Teardown:**  
   The application never invokes `getUserMedia` without explicit user interaction. When vision is disengaged, the stream's tracks are stopped immediately, releasing hardware control and extinguishing the camera activity LED.

---

## 2. Software & Asset Licensing Audit

AERIS is structured to ensure 100% clean, unencumbered licensing suitable for open-source publication and professional technical portfolios.

| Component / Dependency | License | Commercial & Portfolio Usage Rights | Attribution Requirement |
|---|---|---|---|
| **AERIS Core Codebase** | **MIT License** | Full rights for commercial, academic, and portfolio demonstration. | Standard MIT copyright notice. |
| **Procedural 3D Engine Geometry** | **MIT License** | 100% authored in-repo. Zero third-party asset constraints. | Standard MIT copyright notice. |
| **Three.js (r162+)** | **MIT License** | Permissive open-source 3D library. | Included in dependency license manifest. |
| **React & React-DOM** | **MIT License** | Permissive open-source framework. | Included in dependency license manifest. |
| **@mediapipe/tasks-vision** | **Apache License 2.0** | Permissive open-source computer-vision runtime. | Apache 2.0 notice & copyright preserved. |
| **Vite & Vitest** | **MIT License** | Permissive build & test toolchain. | Developer tooling only. |
| **Technical Typography** | **SIL Open Font License (OFL)** | Freely usable in digital applications. | Font metadata preserved. |

### External 3D Models Policy
If optional external GLB models are added in `/public/models/`:
- Only models with explicit **CC0 (Public Domain)** or verified **CC-BY 4.0** licenses from documented institutions (e.g., NASA 3D Resources, Smithsonian 3D) are permitted.
- Any external asset must be cataloged in `ASSET_SELECTION.md` with explicit author attribution, source URL, and license text.

---

## 3. Engineering & Aerospace Legal Disclaimer

The application interface and documentation must feature the following explicit notice:

> **Engineering Disclaimer:**  
> AERIS is a technical demonstration of real-time computer vision and 3D spatial human-computer interaction. The jet-engine geometry, stage configurations, and mechanical metadata (RPM, temperatures, compression ratios) are procedural approximations designed for visual and interaction testing. They do **not** represent certified aerospace engineering blueprints, manufacturer flight data, or operational maintenance specifications.
