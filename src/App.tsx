/**
 * AERIS Application Root & Subsystem Coordinator
 * Document ID: AERIS-DOC-003, AERIS-DOC-009
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraService } from './vision/cameraService';
import { HandTracker } from './vision/handTracker';
import { CameraStatus } from './vision/types';
import { GestureStabilizer } from './gestures/gestureStabilizer';
import { Landmark3D, GestureType } from './gestures/types';
import { InteractionStateMachine } from './interaction/interactionStateMachine';
import { ActionDispatcher } from './interaction/actionDispatcher';
import { InteractionState } from './interaction/types';
import { SpatialMapper } from './interaction/spatialMapper';
import { ComponentId, COMPONENT_REGISTRY } from './scene/ComponentRegistry';
import { RenderMode } from './scene/EngineMaterials';
import { EngineScene, SceneTelemetry } from './scene/EngineScene';
import { WorkspaceHeader } from './ui/WorkspaceHeader';
import { VisionMonitor } from './ui/VisionMonitor';
import { ComponentDossier } from './ui/ComponentDossier';
import { SpatialCursor } from './ui/SpatialCursor';
import { DiagnosticsDrawer } from './ui/DiagnosticsDrawer';
import { GestureGuideModal } from './ui/GestureGuideModal';
import { AlertCircle } from 'lucide-react';

export const App: React.FC = () => {
  // 1. Persistent Subsystem Singletons
  const cameraServiceRef = useRef<CameraService>(new CameraService());
  const handTrackerRef = useRef<HandTracker>(new HandTracker());
  const gestureStabilizerRef = useRef<GestureStabilizer>(new GestureStabilizer(3));
  const fsmRef = useRef<InteractionStateMachine>(new InteractionStateMachine());
  const actionDispatcherRef = useRef<ActionDispatcher>(new ActionDispatcher());

  // 2. React UI State
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('INACTIVE');
  const [renderMode, setRenderMode] = useState<RenderMode>('CAD_WIREFRAME');
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [selectedComponentId, setSelectedComponentId] = useState<ComponentId | null>(null);
  const [hoveredComponentId, setHoveredComponentId] = useState<ComponentId | null>(null);
  const [interactionState, setInteractionState] = useState<InteractionState>('IDLE');
  const [activeGesture, setActiveGesture] = useState<GestureType>('NEUTRAL');
  const [pinchRatio, setPinchRatio] = useState<number>(1.0);
  const [inferenceDurationMs, setInferenceDurationMs] = useState<number>(0);
  const [sceneTelemetry, setSceneTelemetry] = useState<SceneTelemetry>({
    fps: 60,
    frameTimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
  });
  const [landmarks, setLandmarks] = useState<Landmark3D[]>([]);
  const [targetingScreenPos, setTargetingScreenPos] = useState<{ x: number; y: number } | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [cameraErrorNotice, setCameraErrorNotice] = useState<string | null>(null);

  // Previous centroid for delta calculations
  const prevCentroidRef = useRef<[number, number, number] | null>(null);

  // 3. Camera Service Subscription
  useEffect(() => {
    const cameraService = cameraServiceRef.current;
    const unsubscribe = cameraService.subscribe((status, error) => {
      setCameraStatus(status);
      if (status === 'PERMISSION_DENIED') {
        setCameraErrorNotice('Camera permission was denied. Operating in Precision Mouse & Keyboard Fallback Mode.');
      } else if (status === 'ERROR') {
        setCameraErrorNotice(error ? error.message : 'Webcam hardware initialization failure.');
      } else {
        setCameraErrorNotice(null);
      }
    });

    return () => {
      unsubscribe();
      cameraService.stopCamera();
    };
  }, []);

  // 4. FSM State Subscription
  useEffect(() => {
    const fsm = fsmRef.current;
    const unsubscribe = fsm.subscribe((state) => {
      setInteractionState(state);
    });
    return () => unsubscribe();
  }, []);

  // 5. Vision Frame Processing Loop
  useEffect(() => {
    if (cameraStatus !== 'STREAMING') {
      fsmRef.current.send({ type: 'TRACKING_DROPPED' });
      prevCentroidRef.current = null;
      setLandmarks([]);
      setTargetingScreenPos(null);
      return;
    }

    let isRunning = true;
    let animId: number;
    const video = cameraServiceRef.current.getVideoElement();
    const tracker = handTrackerRef.current;
    const stabilizer = gestureStabilizerRef.current;
    const fsm = fsmRef.current;
    const dispatcher = actionDispatcherRef.current;

    let lastVideoTime = -1;

    const visionLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (
        video &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime !== lastVideoTime
      ) {
        lastVideoTime = video.currentTime;
        const startInfer = performance.now();

        const result = tracker.detectFrame(video, timestamp);
        const inferDuration = performance.now() - startInfer;
        setInferenceDurationMs(inferDuration);

        if (result && result.isTrackingValid && result.landmarks.length >= 21) {
          fsm.send({ type: 'HAND_DETECTED' });

          // Process and stabilize landmarks
          const stabilized = stabilizer.processFrame(result.landmarks, result.confidence, timestamp);
          setLandmarks(stabilized.filteredLandmarks);
          setActiveGesture(stabilized.gesture);
          setPinchRatio(stabilized.features.pinchRatio);

          const currentCentroid = stabilized.smoothedCentroid;
          const currentGesture = stabilized.gesture;

          // Dispatch FSM Events & Spatial Actions
          if (currentGesture === 'PINCH_START') {
            fsm.send({ type: 'PINCH_START', centroid: currentCentroid });
            prevCentroidRef.current = currentCentroid;
          } else if (currentGesture === 'PINCH_MOVE') {
            fsm.send({ type: 'PINCH_MOVE', centroid: currentCentroid });

            if (prevCentroidRef.current && fsm.getState() === 'MANIPULATING_ROTATION') {
              const [dx, dy] = SpatialMapper.calculateClampedDelta(
                currentCentroid[0],
                currentCentroid[1],
                prevCentroidRef.current[0],
                prevCentroidRef.current[1]
              );
              // Moving hand horizontally rotates yaw; moving vertically rotates pitch
              dispatcher.dispatchRotation(dx, dy);
            }
            prevCentroidRef.current = currentCentroid;
          } else if (currentGesture === 'PINCH_RELEASE') {
            fsm.send({ type: 'PINCH_RELEASE' });
            prevCentroidRef.current = null;
          } else if (currentGesture === 'POINT') {
            const indexTip = stabilized.filteredLandmarks[8];
            fsm.send({ type: 'POINT_START', pointer: [indexTip.x, indexTip.y] });

            const [ndcX, ndcY] = SpatialMapper.normalizedToNDC(indexTip.x, indexTip.y);
            const screenX = indexTip.x * window.innerWidth;
            const screenY = indexTip.y * window.innerHeight;

            dispatcher.dispatchTargeting(ndcX, ndcY, screenX, screenY);
            setTargetingScreenPos({ x: screenX, y: screenY });
          } else if (currentGesture === 'OPEN_PALM') {
            fsm.send({ type: 'OPEN_PALM_TRIGGERED' });
            dispatcher.dispatchToggleExplode();
            setIsExploded((prev) => !prev);
          } else {
            fsm.send({ type: 'FRAME_TICK', gesture: currentGesture, centroid: currentCentroid });
            dispatcher.dispatch({ type: 'STOP_TARGETING' });
            setTargetingScreenPos(null);
            prevCentroidRef.current = currentCentroid;
          }
        } else {
          // Landmark tracking lost
          fsm.send({ type: 'TRACKING_DROPPED' });
          dispatcher.dispatchSuspend();
          prevCentroidRef.current = null;
          setLandmarks([]);
          setActiveGesture('TRACKING_LOST');
          setTargetingScreenPos(null);
        }
      }

      animId = requestAnimationFrame(visionLoop);
    };

    animId = requestAnimationFrame(visionLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      stabilizer.reset();
      fsm.send({ type: 'TRACKING_DROPPED' });
    };
  }, [cameraStatus]);

  // 6. Camera Toggle Handler
  const handleToggleCamera = useCallback(async () => {
    const cameraService = cameraServiceRef.current;
    if (cameraStatus === 'STREAMING') {
      cameraService.stopCamera();
    } else {
      try {
        if (!handTrackerRef.current.isInitialized()) {
          await handTrackerRef.current.initialize();
        }
        await cameraService.startCamera();
      } catch (err) {
        console.warn('Camera activation aborted or denied:', err);
      }
    }
  }, [cameraStatus]);

  // 7. Global Keyboard Shortcuts Fallback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.code) {
        case 'KeyR':
          actionDispatcherRef.current.dispatchReset();
          setIsExploded(false);
          setSelectedComponentId(null);
          break;
        case 'KeyE':
          actionDispatcherRef.current.dispatchToggleExplode();
          setIsExploded((prev) => !prev);
          break;
        case 'KeyM':
          setRenderMode((prev) => (prev === 'CAD_WIREFRAME' ? 'PBR_METALLIC' : 'CAD_WIREFRAME'));
          break;
        case 'KeyC':
          handleToggleCamera();
          break;
        case 'Escape':
          setSelectedComponentId(null);
          setIsHelpOpen(false);
          actionDispatcherRef.current.dispatchClearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleCamera]);

  return (
    <div className="aeris-workspace">
      {/* 1. Header Navigation Bar */}
      <WorkspaceHeader
        cameraStatus={cameraStatus}
        renderMode={renderMode}
        isExploded={isExploded}
        onToggleCamera={handleToggleCamera}
        onToggleRenderMode={() =>
          setRenderMode((prev) => (prev === 'CAD_WIREFRAME' ? 'PBR_METALLIC' : 'CAD_WIREFRAME'))
        }
        onToggleExplode={() => {
          actionDispatcherRef.current.dispatchToggleExplode();
          setIsExploded((prev) => !prev);
        }}
        onResetView={() => {
          actionDispatcherRef.current.dispatchReset();
          setIsExploded(false);
          setSelectedComponentId(null);
        }}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Main 3D Viewport */}
      <div className="aeris-viewport-container">
        <EngineScene
          renderMode={renderMode}
          actionDispatcher={actionDispatcherRef.current}
          onComponentSelect={(id) => setSelectedComponentId(id)}
          onComponentHover={(id) => setHoveredComponentId(id)}
          onTelemetryUpdate={(tel) => setSceneTelemetry(tel)}
        />

        {/* Spatial Targeting Reticle */}
        {targetingScreenPos && (
          <SpatialCursor
            isVisible={true}
            screenX={targetingScreenPos.x}
            screenY={targetingScreenPos.y}
            isLockedOnTarget={hoveredComponentId !== null}
            hoveredComponentName={
              hoveredComponentId ? COMPONENT_REGISTRY[hoveredComponentId]?.metadata.displayName : null
            }
          />
        )}

        {/* Live Picture-in-Picture Vision Monitor */}
        <VisionMonitor
          cameraStatus={cameraStatus}
          videoElement={cameraServiceRef.current.getVideoElement()}
          landmarks={landmarks}
          activeGesture={activeGesture}
          inferenceDurationMs={inferenceDurationMs}
        />

        {/* Contextual Component Inspection Dossier */}
        <ComponentDossier
          selectedId={selectedComponentId}
          onClose={() => {
            setSelectedComponentId(null);
            actionDispatcherRef.current.dispatchClearSelection();
          }}
        />

        {/* Camera Permission Denial Banner */}
        {cameraErrorNotice && (
          <div
            className="aeris-panel"
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: 'var(--aeris-accent-amber)',
              background: 'rgba(26, 18, 10, 0.9)',
              fontSize: '12px',
            }}
          >
            <AlertCircle size={14} color="var(--aeris-accent-amber)" />
            <span>{cameraErrorNotice}</span>
          </div>
        )}
      </div>

      {/* 3. Real-Time Telemetry & Diagnostics Strip */}
      <DiagnosticsDrawer
        interactionState={interactionState}
        activeGesture={activeGesture}
        pinchRatio={pinchRatio}
        sceneTelemetry={sceneTelemetry}
        inferenceDurationMs={inferenceDurationMs}
      />

      {/* 4. Gesture & Fallback Quick Reference Guide Modal */}
      <GestureGuideModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};
