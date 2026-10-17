/**
 * AERIS Engine 3D Scene Viewport
 * Document ID: AERIS-DOC-003, AERIS-DOC-004
 * Encapsulated Three.js WebGL viewport with direct lifecycle management, 60 FPS render loop,
 * continuous spool kinematics, and mouse/gesture transform integration.
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ComponentId } from './ComponentRegistry';
import { EngineMaterials, RenderMode } from './EngineMaterials';
import { buildProceduralEngine, ProceduralEngineAssembly } from './ProceduralEngine';
import { ExplodedViewEngine } from './ExplodedViewEngine';
import { ComponentRaycaster } from './ComponentRaycaster';
import { ActionDispatcher } from '../interaction/actionDispatcher';
import { SceneAction } from '../interaction/types';

export interface SceneTelemetry {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  triangles: number;
}

export interface EngineSceneProps {
  renderMode: RenderMode;
  actionDispatcher: ActionDispatcher;
  onComponentSelect?: (id: ComponentId | null) => void;
  onComponentHover?: (id: ComponentId | null) => void;
  onTelemetryUpdate?: (telemetry: SceneTelemetry) => void;
}

export const EngineScene: React.FC<EngineSceneProps> = ({
  renderMode,
  actionDispatcher,
  onComponentSelect,
  onComponentHover,
  onTelemetryUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const assemblyRef = useRef<ProceduralEngineAssembly | null>(null);
  const explodedEngineRef = useRef<ExplodedViewEngine | null>(null);
  const raycasterRef = useRef<ComponentRaycaster | null>(null);

  // Rotation quaternions for model manipulation
  const modelQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const targetQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());

  // Mouse fallback state
  const isMouseDownRef = useRef<boolean>(false);
  const mousePrevRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene, Camera, and Renderer Setup
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080a); // Deep obsidian background

    // Subtle coordinate grid plane
    const gridHelper = new THREE.GridHelper(10, 20, 0x212634, 0x111622);
    gridHelper.position.y = -1.8;
    scene.add(gridHelper);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.2, 1.8, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    keyLight.position.set(5, 8, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00e5ff, 0.8); // Subtle cyan fill
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff7a00, 0.6); // Amber rim accent
    rimLight.position.set(0, 5, -6);
    scene.add(rimLight);

    // 3. Procedural Engine Assembly Setup
    const palette = EngineMaterials.getPalette(renderMode);
    const assembly = buildProceduralEngine(palette);
    scene.add(assembly.rootGroup);
    assemblyRef.current = assembly;

    const explodedEngine = new ExplodedViewEngine(assembly.stageNodes);
    explodedEngineRef.current = explodedEngine;

    const raycaster = new ComponentRaycaster(camera, assembly.selectableMeshes);
    raycasterRef.current = raycaster;

    // 4. Action Dispatcher Subscription
    const unsubscribeActions = actionDispatcher.subscribe((action: SceneAction) => {
      switch (action.type) {
        case 'UPDATE_ROTATION': {
          // Pre-multiply delta rotation onto target quaternion
          const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), action.deltaX);
          const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), action.deltaY);
          qYaw.multiply(qPitch);
          targetQuatRef.current.premultiply(qYaw);
          break;
        }

        case 'UPDATE_TARGETING': {
          const hitId = raycaster.castRay(action.ndcX, action.ndcY);
          if (onComponentHover) onComponentHover(hitId);
          break;
        }

        case 'STOP_TARGETING': {
          raycaster.clearHover();
          if (onComponentHover) onComponentHover(null);
          break;
        }

        case 'SELECT_COMPONENT': {
          raycaster.setSelectedComponent(action.componentId);
          if (onComponentSelect) onComponentSelect(action.componentId);
          break;
        }

        case 'CLEAR_SELECTION': {
          raycaster.clearSelection();
          if (onComponentSelect) onComponentSelect(null);
          break;
        }

        case 'TOGGLE_EXPLODE': {
          explodedEngine.toggle();
          break;
        }

        case 'SET_EXPLODE': {
          explodedEngine.setTargetProgress(action.progress);
          break;
        }

        case 'RESET_VIEW': {
          targetQuatRef.current.identity();
          modelQuatRef.current.identity();
          assembly.rootGroup.quaternion.identity();
          camera.position.set(3.2, 1.8, 4.2);
          camera.lookAt(0, 0, 0);
          explodedEngine.reset();
          raycaster.reset();
          if (onComponentSelect) onComponentSelect(null);
          if (onComponentHover) onComponentHover(null);
          break;
        }
      }
    });

    // 5. Mouse Fallback Orbit Controls
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left click only
      isMouseDownRef.current = true;
      mousePrevRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;
      const ndcX = normX * 2 - 1;
      const ndcY = -(normY * 2 - 1);

      // Raycast hover when not dragging
      if (!isMouseDownRef.current) {
        const hitId = raycaster.castRay(ndcX, ndcY);
        if (onComponentHover) onComponentHover(hitId);
      } else {
        // Orbit rotation fallback
        const dx = (e.clientX - mousePrevRef.current.x) * 0.008;
        const dy = (e.clientY - mousePrevRef.current.y) * 0.008;
        mousePrevRef.current = { x: e.clientX, y: e.clientY };

        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx);
        const qPitch = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy);
        qYaw.multiply(qPitch);
        targetQuatRef.current.premultiply(qYaw);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        // If movement was minimal, treat as click selection
        const rect = renderer.domElement.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width;
        const normY = (e.clientY - rect.top) / rect.height;
        const hitId = raycaster.castRay(normX * 2 - 1, -(normY * 2 - 1));
        if (hitId) {
          actionDispatcher.dispatchSelectComponent(hitId);
        } else {
          actionDispatcher.dispatchClearSelection();
        }
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.003;
      const currentDist = camera.position.length();
      const newDist = Math.max(2.0, Math.min(8.5, currentDist + zoomDelta));
      camera.position.setLength(newDist);
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });

    // 6. Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 7. Dedicated Render Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCounter = 0;
    let telemetryAccumulator = 0;

    const renderLoop = (time: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const dt = Math.max((time - lastTime) / 1000, 1e-4);
      lastTime = time;

      // Rotate spools continuously (LP at ~0.6 rad/s, HP at ~2.4 rad/s)
      assembly.lpSpool.rotation.z += 0.6 * dt;
      assembly.hpSpool.rotation.z -= 2.4 * dt; // Counter-rotating core

      // Smoothly slerp model orientation towards target quaternion
      modelQuatRef.current.slerp(targetQuatRef.current, Math.min(1.0, dt * 14.0));
      assembly.rootGroup.quaternion.copy(modelQuatRef.current);

      // Update exploded view interpolation
      explodedEngine.update(dt);

      renderer.render(scene, camera);

      // Performance Telemetry Sampling (throttled to 10 Hz)
      frameCounter++;
      telemetryAccumulator += dt;
      if (telemetryAccumulator >= 0.1) {
        if (onTelemetryUpdate) {
          onTelemetryUpdate({
            fps: Math.round(frameCounter / telemetryAccumulator),
            frameTimeMs: Math.round(dt * 1000 * 10) / 10,
            drawCalls: renderer.info.render.calls,
            triangles: renderer.info.render.triangles,
          });
        }
        frameCounter = 0;
        telemetryAccumulator = 0;
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    // 8. Teardown & Resource Disposal
    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubscribeActions();

      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);

      assembly.dispose();
      renderer.dispose();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [renderMode]);

  return <div ref={containerRef} className="aeris-viewport-container" />;
};
