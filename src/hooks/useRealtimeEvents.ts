import { useEffect, useRef } from 'react';

export interface RealtimeEventPayload {
  type: string;
  data: any;
  timestamp: number;
}

type RealtimeListener = (event: RealtimeEventPayload) => void;

class RealtimeConnectionManager {
  private eventSource: EventSource | null = null;
  private listeners: Set<RealtimeListener> = new Set();
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private retryDelayMs = 4000;
  private isConnecting = false;

  public subscribe(listener: RealtimeListener): () => void {
    this.listeners.add(listener);

    // Cancel pending disconnect if a new subscriber arrives
    if (this.disconnectTimeout) {
      clearTimeout(this.disconnectTimeout);
      this.disconnectTimeout = null;
    }

    this.ensureConnected();

    return () => {
      this.listeners.delete(listener);
      // If no listeners remain, delay closing to prevent rapid re-connections during route navigation
      if (this.listeners.size === 0) {
        this.disconnectTimeout = setTimeout(() => {
          if (this.listeners.size === 0) {
            this.disconnect();
          }
        }, 5000);
      }
    };
  }

  private ensureConnected() {
    if (this.eventSource && this.eventSource.readyState !== EventSource.CLOSED) {
      return;
    }
    if (this.isConnecting) return;
    this.connect();
  }

  private connect() {
    if (typeof window === 'undefined') return;
    this.isConnecting = true;

    try {
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }

      this.eventSource = new EventSource('/api/realtime/stream');

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.retryDelayMs = 4000;
      };

      this.eventSource.onmessage = (e) => {
        try {
          if (!e.data || e.data.startsWith(':')) return; // Ignore heartbeats
          const payload: RealtimeEventPayload = JSON.parse(e.data);
          if (payload) {
            // Notify all registered component listeners
            this.listeners.forEach((listener) => {
              try {
                listener(payload);
              } catch (listenerErr) {
                console.error('[RealtimeManager] Error in listener execution:', listenerErr);
              }
            });
          }
        } catch {
          // Ignore parsing errors for malformed packets
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        // Auto-reconnect with exponential backoff if listeners are still active
        if (this.listeners.size > 0 && !this.retryTimeout) {
          this.retryTimeout = setTimeout(() => {
            this.retryTimeout = null;
            this.retryDelayMs = Math.min(this.retryDelayMs * 1.5, 30000);
            this.connect();
          }, this.retryDelayMs);
        }
      };
    } catch {
      this.isConnecting = false;
      if (this.listeners.size > 0 && !this.retryTimeout) {
        this.retryTimeout = setTimeout(() => {
          this.retryTimeout = null;
          this.connect();
        }, this.retryDelayMs);
      }
    }
  }

  private disconnect() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }
}

// Global tab singleton instance
const realtimeManager = new RealtimeConnectionManager();

export function useRealtimeEvents(onEvent?: (event: RealtimeEventPayload) => void) {
  const eventHandlerRef = useRef(onEvent);
  eventHandlerRef.current = onEvent;

  useEffect(() => {
    if (!onEvent) return;

    const unsubscribe = realtimeManager.subscribe((event) => {
      if (eventHandlerRef.current) {
        eventHandlerRef.current(event);
      }
    });

    return unsubscribe;
  }, []);
}
