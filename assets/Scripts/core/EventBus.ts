import { GameEvent } from './types';

export class EventBus {
  private handlers = new Set<(event: GameEvent) => void>();

  emit(event: GameEvent): void {
    this.handlers.forEach(h => h(event));
  }

  on(handler: (event: GameEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
}
