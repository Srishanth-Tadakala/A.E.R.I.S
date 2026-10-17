/**
 * AERIS Component Raycaster & Highlighter
 * Document ID: AERIS-DOC-003, AERIS-DOC-007
 * Raycasts NDC coordinates against selectable meshes, crawls parent hierarchy, and manages highlight materials.
 */

import * as THREE from 'three';
import { ComponentId, resolveComponentFromObject } from './ComponentRegistry';

export class ComponentRaycaster {
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;
  private selectableMeshes: THREE.Mesh[];
  private hoveredId: ComponentId | null = null;
  private selectedId: ComponentId | null = null;
  private ndcVector: THREE.Vector2;

  constructor(camera: THREE.Camera, selectableMeshes: THREE.Mesh[]) {
    this.raycaster = new THREE.Raycaster();
    this.camera = camera;
    this.selectableMeshes = selectableMeshes;
    this.ndcVector = new THREE.Vector2();
  }

  updateSelectableMeshes(meshes: THREE.Mesh[]): void {
    this.selectableMeshes = meshes;
  }

  castRay(ndcX: number, ndcY: number): ComponentId | null {
    this.ndcVector.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.ndcVector, this.camera);

    const intersects = this.raycaster.intersectObjects(this.selectableMeshes, false);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const componentId = resolveComponentFromObject(hit);
      if (componentId) {
        this.hoveredId = componentId;
        return componentId;
      }
    }

    this.hoveredId = null;
    return null;
  }

  getHoveredComponent(): ComponentId | null {
    return this.hoveredId;
  }

  getSelectedComponent(): ComponentId | null {
    return this.selectedId;
  }

  setSelectedComponent(id: ComponentId | null): void {
    this.selectedId = id;
  }

  clearHover(): void {
    this.hoveredId = null;
  }

  clearSelection(): void {
    this.selectedId = null;
  }

  reset(): void {
    this.hoveredId = null;
    this.selectedId = null;
  }
}
