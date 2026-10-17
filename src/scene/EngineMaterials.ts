/**
 * AERIS Engine Material Factory
 * Document ID: AERIS-DOC-004
 * Generates Technical CAD Wireframe and PBR Metallic material palettes.
 */

import * as THREE from 'three';

export type RenderMode = 'CAD_WIREFRAME' | 'PBR_METALLIC';

export interface MaterialPalette {
  mode: RenderMode;
  titanium: THREE.Material;
  superalloy: THREE.Material;
  ceramic: THREE.Material;
  casing: THREE.Material;
  shaft: THREE.Material;
  highlight: THREE.MeshBasicMaterial;
  wireframeAccent: THREE.LineBasicMaterial;
}

export class EngineMaterials {
  private static palettes: Map<RenderMode, MaterialPalette> = new Map();

  static getPalette(mode: RenderMode): MaterialPalette {
    let palette = this.palettes.get(mode);
    if (!palette) {
      palette = this.createPalette(mode);
      this.palettes.set(mode, palette);
    }
    return palette;
  }

  private static createPalette(mode: RenderMode): MaterialPalette {
    if (mode === 'CAD_WIREFRAME') {
      return {
        mode,
        titanium: new THREE.MeshStandardMaterial({
          color: 0x1a2333,
          emissive: 0x00e5ff,
          emissiveIntensity: 0.15,
          wireframe: true,
          roughness: 0.4,
          metalness: 0.8,
        }),
        superalloy: new THREE.MeshStandardMaterial({
          color: 0x2b1c11,
          emissive: 0xff7a00,
          emissiveIntensity: 0.25,
          wireframe: true,
          roughness: 0.3,
          metalness: 0.9,
        }),
        ceramic: new THREE.MeshStandardMaterial({
          color: 0x331a00,
          emissive: 0xff4400,
          emissiveIntensity: 0.3,
          wireframe: true,
          roughness: 0.8,
          metalness: 0.1,
        }),
        casing: new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          emissive: 0x8892b0,
          emissiveIntensity: 0.1,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
          depthWrite: false,
        }),
        shaft: new THREE.MeshStandardMaterial({
          color: 0x1e293b,
          emissive: 0x38bdf8,
          emissiveIntensity: 0.2,
          wireframe: true,
        }),
        highlight: new THREE.MeshBasicMaterial({
          color: 0x00e5ff,
          wireframe: true,
        }),
        wireframeAccent: new THREE.LineBasicMaterial({
          color: 0x00e5ff,
          transparent: true,
          opacity: 0.7,
        }),
      };
    }

    // Photorealistic PBR Mode
    return {
      mode,
      titanium: new THREE.MeshStandardMaterial({
        color: 0x8b9bb4,
        roughness: 0.25,
        metalness: 0.85,
      }),
      superalloy: new THREE.MeshStandardMaterial({
        color: 0xb57c48, // Heat-tinted Inconel
        roughness: 0.35,
        metalness: 0.9,
      }),
      ceramic: new THREE.MeshStandardMaterial({
        color: 0xd9c8b4, // YSZ Thermal barrier ceramic
        roughness: 0.75,
        metalness: 0.05,
      }),
      casing: new THREE.MeshStandardMaterial({
        color: 0x1f242d,
        roughness: 0.5,
        metalness: 0.4,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      }),
      shaft: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.2,
        metalness: 0.95,
      }),
      highlight: new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        wireframe: true,
      }),
      wireframeAccent: new THREE.LineBasicMaterial({
        color: 0xffaa00,
      }),
    };
  }

  static disposeAll(): void {
    this.palettes.forEach((palette) => {
      Object.values(palette).forEach((mat) => {
        if (mat && typeof mat.dispose === 'function') {
          mat.dispose();
        }
      });
    });
    this.palettes.clear();
  }
}
