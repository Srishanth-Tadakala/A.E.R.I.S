/**
 * Canonical Interaction State Machine
 * Document ID: AERIS-DOC-008
 * Pure TypeScript Finite State Machine with strict safety invariants and zero transform jump recovery.
 */

import { InteractionState, InteractionEvent } from './types';

export type StateChangeListener = (
  currentState: InteractionState,
  previousState: InteractionState,
  event: InteractionEvent
) => void;

export class InteractionStateMachine {
  private state: InteractionState = 'IDLE';
  private listeners: Set<StateChangeListener> = new Set();
  private isAnchorStale: boolean = true;
  private activeAnchor: [number, number] | null = null;

  getState(): InteractionState {
    return this.state;
  }

  isAnchorValid(): boolean {
    return !this.isAnchorStale && this.activeAnchor !== null;
  }

  getAnchor(): [number, number] | null {
    return this.activeAnchor;
  }

  subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private transition(nextState: InteractionState, event: InteractionEvent): void {
    if (this.state === nextState) return;

    const prevState = this.state;
    this.state = nextState;

    // State entry actions & invariant enforcement
    if (nextState === 'TRACKING_LOST') {
      this.isAnchorStale = true;
      this.activeAnchor = null;
    } else if (nextState === 'RECOVERY') {
      this.isAnchorStale = true; // First frame must re-seed
    } else if (nextState === 'IDLE') {
      this.isAnchorStale = true;
      this.activeAnchor = null;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(nextState, prevState, event);
      } catch (e) {
        console.error('Error in state change listener:', e);
      }
    });
  }

  send(event: InteractionEvent): InteractionState {
    switch (this.state) {
      case 'IDLE':
        if (event.type === 'HAND_DETECTED') {
          this.transition('TRACKING', event);
        }
        break;

      case 'TRACKING':
        if (event.type === 'TRACKING_DROPPED') {
          this.transition('IDLE', event);
        } else if (event.type === 'PINCH_START') {
          this.activeAnchor = [event.centroid[0], event.centroid[1]];
          this.isAnchorStale = false;
          this.transition('MANIPULATING_ROTATION', event);
        } else if (event.type === 'POINT_START') {
          this.transition('COMPONENT_TARGETING', event);
        } else if (event.type === 'OPEN_PALM_TRIGGERED') {
          // Handled via action dispatcher without persistent modal lock
        }
        break;

      case 'MANIPULATING_ROTATION':
        if (event.type === 'TRACKING_DROPPED') {
          this.transition('TRACKING_LOST', event);
        } else if (event.type === 'PINCH_RELEASE') {
          this.activeAnchor = null;
          this.transition('TRACKING', event);
        } else if (event.type === 'PINCH_MOVE') {
          if (this.isAnchorStale) {
            this.activeAnchor = [event.centroid[0], event.centroid[1]];
            this.isAnchorStale = false;
          }
        }
        break;

      case 'COMPONENT_TARGETING':
        if (event.type === 'TRACKING_DROPPED') {
          this.transition('TRACKING_LOST', event);
        } else if (event.type === 'PINCH_START') {
          // Pinching while targeting confirms selection
          this.transition('OBJECT_SELECTED', event);
        } else if (event.type === 'TARGET_MISSED' || event.type === 'PINCH_RELEASE') {
          this.transition('TRACKING', event);
        }
        break;

      case 'OBJECT_SELECTED':
        if (event.type === 'TRACKING_DROPPED') {
          this.transition('TRACKING_LOST', event);
        } else if (event.type === 'POINT_START' || event.type === 'PINCH_START') {
          this.transition('COMPONENT_TARGETING', event);
        }
        break;

      case 'TRACKING_LOST':
        if (event.type === 'HAND_REACQUIRED') {
          this.transition('RECOVERY', event);
        } else if (event.type === 'RESET_TRIGGERED') {
          this.transition('IDLE', event);
        }
        break;

      case 'RECOVERY':
        if (event.type === 'FRAME_TICK') {
          this.activeAnchor = [event.centroid[0], event.centroid[1]];
          this.isAnchorStale = false;
          this.transition('TRACKING', event);
        } else if (event.type === 'TRACKING_DROPPED') {
          this.transition('TRACKING_LOST', event);
        }
        break;
    }

    if (event.type === 'RESET_TRIGGERED') {
      this.transition('IDLE', event);
    }

    return this.state;
  }

  reset(): void {
    this.state = 'IDLE';
    this.isAnchorStale = true;
    this.activeAnchor = null;
  }
}
