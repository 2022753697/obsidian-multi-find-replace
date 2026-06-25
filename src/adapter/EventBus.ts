import { Event } from '../types';

type Handler = (...args: any[]) => void;

export class EventBus {
  private listeners: Map<Event, Set<Handler>> = new Map();

  subscribe(event: Event, handler: Handler): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  unsubscribe(event: Event, handler: Handler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: Event, ...data: any[]): void {
    this.listeners.get(event)?.forEach(handler => {
      try {
        handler(...data);
      } catch (e) {
        console.error(`EventBus handler error for ${event}:`, e);
      }
    });
  }

  clear(): void {
    this.listeners.clear();
  }
}