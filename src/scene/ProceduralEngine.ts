/**
 * AERIS Procedural Jet Engine Model Generator
 * Document ID: AERIS-DOC-004
 * Parametric 8-stage dual-spool turbofan assembly utilizing THREE.InstancedMesh clustering (<20 draw calls).
 */

import * as THREE from 'three';
import { ComponentId, COMPONENT_REGISTRY } from './ComponentRegistry';
import { MaterialPalette } from './EngineMaterials';

export interface ProceduralEngineAssembly {
  rootGroup: THREE.Group;
  lpSpool: THREE.Group;
  hpSpool: THREE.Group;
  staticGroup: THREE.Group;
  stageNodes: Map<ComponentId, THREE.Group>;
  selectableMeshes: THREE.Mesh[];
  dispose: () => void;
}

export function buildProceduralEngine(palette: MaterialPalette): ProceduralEngineAssembly {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Engine_Root';

  const lpSpool = new THREE.Group();
  lpSpool.name = 'LP_Spool_Group';

  const hpSpool = new THREE.Group();
  hpSpool.name = 'HP_Spool_Group';

  const staticGroup = new THREE.Group();
  staticGroup.name = 'Static_Structural_Group';

  rootGroup.add(lpSpool);
  rootGroup.add(hpSpool);
  rootGroup.add(staticGroup);

  const stageNodes = new Map<ComponentId, THREE.Group>();
  const selectableMeshes: THREE.Mesh[] = [];
  const geometriesToDispose: THREE.BufferGeometry[] = [];

  function registerStage(id: ComponentId, parent: THREE.Group): THREE.Group {
    const stageGroup = new THREE.Group();
    stageGroup.name = COMPONENT_REGISTRY[id].sceneNodeName;
    stageGroup.userData = { componentId: id };
    parent.add(stageGroup);
    stageNodes.set(id, stageGroup);
    return stageGroup;
  }

  function addSelectableMesh(mesh: THREE.Mesh, stageId: ComponentId): void {
    mesh.userData = { componentId: stageId };
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    selectableMeshes.push(mesh);
  }

  // Statically shared scratch matrix for instancing
  const scratchMatrix = new THREE.Matrix4();
  const scratchPosition = new THREE.Vector3();
  const scratchRotation = new THREE.Euler();
  const scratchQuaternion = new THREE.Quaternion();
  const scratchScale = new THREE.Vector3(1, 1, 1);

  // =========================================================================
  // 1. STAGE: INTAKE SPINNER (LP Spool)
  // =========================================================================
  const spinnerStage = registerStage('intake_spinner', lpSpool);
  const spinnerGeo = new THREE.ConeGeometry(0.32, 0.75, 32);
  spinnerGeo.rotateX(Math.PI / 2); // Point forward along +Z
  geometriesToDispose.push(spinnerGeo);

  const spinnerMesh = new THREE.Mesh(spinnerGeo, palette.titanium);
  spinnerMesh.position.set(0, 0, 1.8);
  spinnerStage.add(spinnerMesh);
  addSelectableMesh(spinnerMesh, 'intake_spinner');

  // =========================================================================
  // 2. STAGE: FAN BLADES & DISK (LP Spool)
  // =========================================================================
  const fanStage = registerStage('fan_blades', lpSpool);
  const fanDiskGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.2, 32);
  fanDiskGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(fanDiskGeo);

  const fanDiskMesh = new THREE.Mesh(fanDiskGeo, palette.titanium);
  fanDiskMesh.position.set(0, 0, 1.4);
  fanStage.add(fanDiskMesh);
  addSelectableMesh(fanDiskMesh, 'fan_blades');

  // 24 Instanced Wide-Chord Aerodynamic Fan Blades
  const fanBladeGeo = new THREE.BoxGeometry(0.12, 0.72, 0.025);
  geometriesToDispose.push(fanBladeGeo);
  const fanBladeCount = 24;
  const fanBladesMesh = new THREE.InstancedMesh(fanBladeGeo, palette.titanium, fanBladeCount);
  fanBladesMesh.position.set(0, 0, 1.4);

  for (let i = 0; i < fanBladeCount; i++) {
    const angle = (i / fanBladeCount) * Math.PI * 2;
    const radius = 0.72;
    scratchPosition.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    scratchRotation.set(0, 0, angle + Math.PI / 2);
    scratchRotation.z += 0.35; // Aerodynamic pitch angle
    scratchQuaternion.setFromEuler(scratchRotation);

    scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
    fanBladesMesh.setMatrixAt(i, scratchMatrix);
  }
  fanBladesMesh.instanceMatrix.needsUpdate = true;
  fanStage.add(fanBladesMesh);
  addSelectableMesh(fanBladesMesh, 'fan_blades');

  // =========================================================================
  // 3. STAGE: LOW-PRESSURE COMPRESSOR (LPC / BOOSTER) (LP Spool)
  // =========================================================================
  const lpcStage = registerStage('lpc_booster', lpSpool);
  const lpcBladeGeo = new THREE.BoxGeometry(0.04, 0.22, 0.015);
  geometriesToDispose.push(lpcBladeGeo);

  const lpcStages = [
    { z: 1.15, radius: 0.52, count: 28 },
    { z: 0.95, radius: 0.48, count: 32 },
    { z: 0.75, radius: 0.44, count: 36 },
  ];

  lpcStages.forEach((cfg) => {
    // Drum disk
    const diskGeo = new THREE.CylinderGeometry(cfg.radius * 0.65, cfg.radius * 0.65, 0.08, 24);
    diskGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(diskGeo);
    const disk = new THREE.Mesh(diskGeo, palette.titanium);
    disk.position.set(0, 0, cfg.z);
    lpcStage.add(disk);
    addSelectableMesh(disk, 'lpc_booster');

    // Blades
    const instMesh = new THREE.InstancedMesh(lpcBladeGeo, palette.titanium, cfg.count);
    instMesh.position.set(0, 0, cfg.z);
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2;
      scratchPosition.set(Math.cos(angle) * cfg.radius, Math.sin(angle) * cfg.radius, 0);
      scratchRotation.set(0, 0, angle + Math.PI / 2 + 0.25);
      scratchQuaternion.setFromEuler(scratchRotation);
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
      instMesh.setMatrixAt(i, scratchMatrix);
    }
    instMesh.instanceMatrix.needsUpdate = true;
    lpcStage.add(instMesh);
    addSelectableMesh(instMesh, 'lpc_booster');
  });

  // =========================================================================
  // 4. STAGE: HIGH-PRESSURE COMPRESSOR (HPC CORE) (HP Spool)
  // =========================================================================
  const hpcStage = registerStage('hpc_core', hpSpool);
  const hpcBladeGeo = new THREE.BoxGeometry(0.025, 0.14, 0.01);
  geometriesToDispose.push(hpcBladeGeo);

  // Tapered drum core
  const hpcDrumGeo = new THREE.CylinderGeometry(0.28, 0.38, 0.6, 24);
  hpcDrumGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(hpcDrumGeo);
  const hpcDrum = new THREE.Mesh(hpcDrumGeo, palette.superalloy);
  hpcDrum.position.set(0, 0, 0.3);
  hpcStage.add(hpcDrum);
  addSelectableMesh(hpcDrum, 'hpc_core');

  // 6 Blisk Rings
  const hpcStages = [
    { z: 0.55, r: 0.40, count: 32 },
    { z: 0.45, r: 0.37, count: 36 },
    { z: 0.35, r: 0.34, count: 40 },
    { z: 0.25, r: 0.32, count: 44 },
    { z: 0.15, r: 0.30, count: 48 },
    { z: 0.05, r: 0.28, count: 52 },
  ];

  hpcStages.forEach((cfg) => {
    const instMesh = new THREE.InstancedMesh(hpcBladeGeo, palette.superalloy, cfg.count);
    instMesh.position.set(0, 0, cfg.z);
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2;
      scratchPosition.set(Math.cos(angle) * cfg.r, Math.sin(angle) * cfg.r, 0);
      scratchRotation.set(0, 0, angle + Math.PI / 2 + 0.3);
      scratchQuaternion.setFromEuler(scratchRotation);
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
      instMesh.setMatrixAt(i, scratchMatrix);
    }
    instMesh.instanceMatrix.needsUpdate = true;
    hpcStage.add(instMesh);
    addSelectableMesh(instMesh, 'hpc_core');
  });

  // =========================================================================
  // 5. STAGE: ANNULAR COMBUSTOR (Static Structural Core)
  // =========================================================================
  const combustorStage = registerStage('combustor', staticGroup);
  const linerGeo = new THREE.CylinderGeometry(0.36, 0.34, 0.32, 24, 1, true);
  linerGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(linerGeo);
  const linerMesh = new THREE.Mesh(linerGeo, palette.ceramic);
  linerMesh.position.set(0, 0, -0.2);
  combustorStage.add(linerMesh);
  addSelectableMesh(linerMesh, 'combustor');

  // 18 Circumferential Fuel Injector Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.08, 12);
  geometriesToDispose.push(nozzleGeo);
  const injectorCount = 18;
  const injectorsMesh = new THREE.InstancedMesh(nozzleGeo, palette.superalloy, injectorCount);
  injectorsMesh.position.set(0, 0, -0.15);

  for (let i = 0; i < injectorCount; i++) {
    const angle = (i / injectorCount) * Math.PI * 2;
    const r = 0.37;
    scratchPosition.set(Math.cos(angle) * r, Math.sin(angle) * r, 0);
    scratchRotation.set(0, 0, angle);
    scratchQuaternion.setFromEuler(scratchRotation);
    scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
    injectorsMesh.setMatrixAt(i, scratchMatrix);
  }
  injectorsMesh.instanceMatrix.needsUpdate = true;
  combustorStage.add(injectorsMesh);
  addSelectableMesh(injectorsMesh, 'combustor');

  // =========================================================================
  // 6. STAGE: HIGH-PRESSURE TURBINE (HPT) (HP Spool)
  // =========================================================================
  const hptStage = registerStage('hpt_turbine', hpSpool);
  const hptDiskGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.09, 24);
  hptDiskGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(hptDiskGeo);
  const hptDisk = new THREE.Mesh(hptDiskGeo, palette.superalloy);
  hptDisk.position.set(0, 0, -0.45);
  hptStage.add(hptDisk);
  addSelectableMesh(hptDisk, 'hpt_turbine');

  const hptBladeGeo = new THREE.BoxGeometry(0.03, 0.16, 0.015);
  geometriesToDispose.push(hptBladeGeo);
  const hptBladeCount = 36;
  const hptBlades = new THREE.InstancedMesh(hptBladeGeo, palette.superalloy, hptBladeCount);
  hptBlades.position.set(0, 0, -0.45);

  for (let i = 0; i < hptBladeCount; i++) {
    const angle = (i / hptBladeCount) * Math.PI * 2;
    scratchPosition.set(Math.cos(angle) * 0.36, Math.sin(angle) * 0.36, 0);
    scratchRotation.set(0, 0, angle + Math.PI / 2 - 0.35); // Opposite twist for turbine
    scratchQuaternion.setFromEuler(scratchRotation);
    scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
    hptBlades.setMatrixAt(i, scratchMatrix);
  }
  hptBlades.instanceMatrix.needsUpdate = true;
  hptStage.add(hptBlades);
  addSelectableMesh(hptBlades, 'hpt_turbine');

  // =========================================================================
  // 7. STAGE: LOW-PRESSURE TURBINE (LPT) (LP Spool)
  // =========================================================================
  const lptStage = registerStage('lpt_turbine', lpSpool);
  const lptBladeGeo = new THREE.BoxGeometry(0.035, 0.22, 0.015);
  geometriesToDispose.push(lptBladeGeo);

  const lptStages = [
    { z: -0.68, r: 0.38, count: 32 },
    { z: -0.85, r: 0.42, count: 36 },
    { z: -1.05, r: 0.46, count: 40 },
  ];

  lptStages.forEach((cfg) => {
    const diskGeo = new THREE.CylinderGeometry(cfg.r * 0.65, cfg.r * 0.65, 0.08, 24);
    diskGeo.rotateX(Math.PI / 2);
    geometriesToDispose.push(diskGeo);
    const disk = new THREE.Mesh(diskGeo, palette.titanium);
    disk.position.set(0, 0, cfg.z);
    lptStage.add(disk);
    addSelectableMesh(disk, 'lpt_turbine');

    const instMesh = new THREE.InstancedMesh(lptBladeGeo, palette.titanium, cfg.count);
    instMesh.position.set(0, 0, cfg.z);
    for (let i = 0; i < cfg.count; i++) {
      const angle = (i / cfg.count) * Math.PI * 2;
      scratchPosition.set(Math.cos(angle) * cfg.r, Math.sin(angle) * cfg.r, 0);
      scratchRotation.set(0, 0, angle + Math.PI / 2 - 0.3);
      scratchQuaternion.setFromEuler(scratchRotation);
      scratchMatrix.compose(scratchPosition, scratchQuaternion, scratchScale);
      instMesh.setMatrixAt(i, scratchMatrix);
    }
    instMesh.instanceMatrix.needsUpdate = true;
    lptStage.add(instMesh);
    addSelectableMesh(instMesh, 'lpt_turbine');
  });

  // =========================================================================
  // 8. STAGE: EXHAUST NOZZLE & PLUG (Static Structural Core)
  // =========================================================================
  const exhaustStage = registerStage('exhaust_nozzle', staticGroup);
  // Centerbody bullet cone
  const plugGeo = new THREE.ConeGeometry(0.24, 0.8, 24);
  plugGeo.rotateX(-Math.PI / 2); // Points aft along -Z
  geometriesToDispose.push(plugGeo);
  const plugMesh = new THREE.Mesh(plugGeo, palette.titanium);
  plugMesh.position.set(0, 0, -1.6);
  exhaustStage.add(plugMesh);
  addSelectableMesh(plugMesh, 'exhaust_nozzle');

  // Convergent outer exhaust duct
  const ductGeo = new THREE.CylinderGeometry(0.48, 0.58, 0.6, 24, 1, true);
  ductGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(ductGeo);
  const ductMesh = new THREE.Mesh(ductGeo, palette.titanium);
  ductMesh.position.set(0, 0, -1.4);
  exhaustStage.add(ductMesh);
  addSelectableMesh(ductMesh, 'exhaust_nozzle');

  // =========================================================================
  // 9. STAGE: OUTER BYPASS CASING (Static Structural / Semi-Transparent)
  // =========================================================================
  const casingStage = registerStage('outer_casing', staticGroup);
  // Nacelle with 135-degree cutaway opening
  const nacelleGeo = new THREE.CylinderGeometry(
    1.22,
    1.18,
    3.3,
    32,
    1,
    true,
    Math.PI * 0.15,
    Math.PI * 1.35
  );
  nacelleGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(nacelleGeo);
  const nacelleMesh = new THREE.Mesh(nacelleGeo, palette.casing);
  nacelleMesh.position.set(0, 0, 0.1);
  casingStage.add(nacelleMesh);
  addSelectableMesh(nacelleMesh, 'outer_casing');

  // Dual Spool Shafts
  // Inner LP Shaft running from fan to LPT
  const lpShaftGeo = new THREE.CylinderGeometry(0.05, 0.05, 3.2, 16);
  lpShaftGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(lpShaftGeo);
  const lpShaftMesh = new THREE.Mesh(lpShaftGeo, palette.shaft);
  lpShaftMesh.position.set(0, 0, 0.1);
  lpSpool.add(lpShaftMesh);

  // Outer HP Shaft running through HPC to HPT
  const hpShaftGeo = new THREE.CylinderGeometry(0.11, 0.11, 1.2, 16);
  hpShaftGeo.rotateX(Math.PI / 2);
  geometriesToDispose.push(hpShaftGeo);
  const hpShaftMesh = new THREE.Mesh(hpShaftGeo, palette.shaft);
  hpShaftMesh.position.set(0, 0, 0.0);
  hpSpool.add(hpShaftMesh);

  return {
    rootGroup,
    lpSpool,
    hpSpool,
    staticGroup,
    stageNodes,
    selectableMeshes,
    dispose: () => {
      geometriesToDispose.forEach((geo) => geo.dispose());
    },
  };
}
