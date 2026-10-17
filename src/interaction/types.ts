/**
 * Interaction State Machine & Action Types
 * Document ID: AERIS-DOC-008
 */

import { ComponentId } from '../scene/ComponentRegistry';
import { GestureType } from '../gestures/types';

export type InteractionState =
  | 'IDLE'
  | 'TRACKING'
  | 'GESTURE_CANDIDATE'
  | 'GESTURE_CONFIRMED'
  | 'MANIPULATING_ROTATION'
  | 'COMPONENT_TARGETING'
  | 'OBJECT_SELECTED'
  | 'TRACKING_LOST'
  | 'RECOVERY';

export type InteractionEvent =
  | { type: 'HAND_DETECTED' }
  | { type: 'FRAME_TICK'; gesture: GestureType; centroid: [number, number, number] }
  | { type: 'PINCH_START'; centroid: [number, number, number] }
  | { type: 'PINCH_MOVE'; centroid: [number, number, number] }
  | { type: 'PINCH_RELEASE' }
  | { type: 'POINT_START'; pointer: [number, number] }
  | { type: 'POINT_MOVE'; pointer: [number, number] }
  | { type: 'OPEN_PALM_TRIGGERED' }
  | { type: 'TARGET_HIT'; componentId: ComponentId }
  | { type: 'TARGET_MISSED' }
  | { type: 'TRACKING_DROPPED' }
  | { type: 'HAND_REACQUIRED' }
  | { type: 'RESET_TRIGGERED' };

export type SceneAction =
  | { type: 'START_ROTATION'; anchor: [number, number] }
  | { type: 'UPDATE_ROTATION'; deltaX: number; deltaY: number }
  | { type: 'END_ROTATION' }
  | { type: 'UPDATE_TARGETING'; ndcX: number; ndcY: number; screenX: number; screenY: number }
  | { type: 'STOP_TARGETING' }
  | { type: 'SELECT_COMPONENT'; componentId: ComponentId }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'TOGGLE_EXPLODE' }
  | { type: 'SET_EXPLODE'; progress: number }
  | { type: 'RESET_VIEW' }
  | { type: 'SUSPEND_MANIPULATION' };
