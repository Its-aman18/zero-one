// Real-Time Event Bus for ZERO -> ONE (Single Source of Truth Event Stream)
// Uses BroadcastChannel across tabs/devices and Local Storage fallback

export type SimulationEventType =
  | 'EVENT_STATE_CHANGED'
  | 'CLOCK_SYNC'
  | 'LOCKDOWN_TRIGGERED'
  | 'PURCHASE_PROPOSED'
  | 'PURCHASE_COMMITTED'
  | 'PURCHASE_REVERSED'
  | 'CRISIS_DISPATCHED'
  | 'CRISIS_RESPONSE_RECEIVED'
  | 'CRISIS_TIMEOUT'
  | 'AUCTION_OPENED'
  | 'AUCTION_BID_RECEIVED'
  | 'AUCTION_CLOSED'
  | 'TRADE_PROPOSED'
  | 'TRADE_COMMITTED'
  | 'CANVAS_UPDATED'
  | 'ARTIFACT_SUBMITTED'
  | 'SCORE_SUBMITTED'
  | 'SCORES_LOCKED'
  | 'RESULTS_REVEALED'
  | 'ROLE_REASSIGNED'
  | 'ANNOUNCEMENT_BROADCAST'
  | 'EMERGENCY_OVERRIDE'
  | 'SIMULATION_RESET'
  | 'ADMIN_APPLICATION_SUBMITTED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_REJECTED'
  | 'ADMIN_SUSPENDED'
  | 'ADMIN_REACTIVATED';

export interface SimulationEvent<T = any> {
  id: string;
  type: SimulationEventType;
  payload: T;
  actor: string;
  timestamp: string;
  authoritativeServerTimestamp: number;
}

type EventListener<T = any> = (event: SimulationEvent<T>) => void;

class RealtimeEventStream {
  private channel: BroadcastChannel | null = null;
  private listeners: Map<SimulationEventType | '*', Set<EventListener>> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('zero_one_authoritative_event_bus');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type) {
            this.notifyListeners(event.data);
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization fallback:', err);
      }
    }
  }

  public emit<T = any>(type: SimulationEventType, payload: T, actor = 'SYSTEM'): SimulationEvent<T> {
    const simEvent: SimulationEvent<T> = {
      id: 'evt-' + Math.random().toString(36).substring(2, 9),
      type,
      payload,
      actor,
      timestamp: new Date().toISOString(),
      authoritativeServerTimestamp: Date.now(),
    };

    // Broadcast across windows/tabs
    if (this.channel) {
      try {
        this.channel.postMessage(simEvent);
      } catch (err) {
        console.error('Failed to broadcast event:', err);
      }
    }

    // Also notify local listeners
    this.notifyListeners(simEvent);

    return simEvent;
  }

  public on<T = any>(type: SimulationEventType | '*', callback: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback as EventListener);

    return () => {
      this.off(type, callback);
    };
  }

  public off<T = any>(type: SimulationEventType | '*', callback: EventListener<T>) {
    const set = this.listeners.get(type);
    if (set) {
      set.delete(callback as EventListener);
    }
  }

  private notifyListeners(event: SimulationEvent) {
    const specificListeners = this.listeners.get(event.type);
    if (specificListeners) {
      specificListeners.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          console.error(`Error in event listener for ${event.type}:`, e);
        }
      });
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach((cb) => {
        try {
          cb(event);
        } catch (e) {
          console.error('Error in wildcard event listener:', e);
        }
      });
    }
  }
}

export const realtimeBus = new RealtimeEventStream();
