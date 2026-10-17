/**
 * Action Dispatcher Subsystem
 * Document ID: AERIS-DOC-007
 * Translates interaction states and spatial inputs into typed SceneActions.
 */

import { SceneAction } from './types';
import { ComponentId } from '../scene/ComponentRegistry';

export type ActionSubscriber = (action: SceneAction) => void;

export class ActionDispatcher {
  private subscribers: Set<ActionSubscriber> = new Set();
  private rotationSensitivity: number = 3.2;

  subscribe(subscriber: ActionSubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  dispatch(action: SceneAction): void {
    this.subscribers.forEach((sub) => {
      try {
        sub(action);
      } catch (e) {
        console.error('Error in action subscriber:', e);
      }
    });
  }

  setSensitivity(sensitivity: number): void {
    this.rotationSensitivity = Math.max(0.5, Math.min(10.0, sensitivity));
  }

  getSensitivity(): number {
    return this.rotationSensitivity;
  }

  dispatchRotation(deltaX: number, deltaY: number): void {
    this.dispatch({
      type: 'UPDATE_ROTATION',
      deltaX: deltaX * this.rotationSensitivity,
      deltaY: deltaY * this.rotationSensitivity,
    });
  }

  dispatchTargeting(ndcX: number, ndcY: number, screenX: number, screenY: number): void {
    this.dispatch({
      type: 'UPDATE_TARGETING',
      ndcX,
      ndcY,
      screenX,
      screenY,
    });
  }

  dispatchSelectComponent(componentId: ComponentId): void {
    this.dispatch({
      type: 'SELECT_COMPONENT',
      componentId,
    });
  }

  dispatchClearSelection(): void {
    this.dispatch({ type: 'CLEAR_SELECTION' });
  }

  dispatchToggleExplode(): void {
    this.dispatch({ type: 'TOGGLE_EXPLODE' });
  }

  dispatchSetExplode(progress: number): void {
    this.dispatch({
      type: 'SET_EXPLODE',
      progress: Math.max(0.0, Math.min(1.0, progress)),
    });
  }

  dispatchReset(): void {
    this.dispatch({ type: 'RESET_VIEW' });
  }

  dispatchSuspend(): void {
    this.dispatch({ type: 'SUSPEND_MANIPULATION' });
  }
}
