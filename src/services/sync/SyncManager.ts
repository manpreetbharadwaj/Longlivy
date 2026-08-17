import { SyncQueueItem } from '@/features/sync/models';
import { generateId } from '@/utils/id';

/**
 * Minimal offline-first sync queue. Mock repositories already persist
 * locally via AsyncStorage, so for the prototype this manager mainly models
 * the *shape* of the eventual sync flow (enqueue -> flush -> mark synced)
 * that a real API-backed repository would drive.
 */
export class SyncManager {
  private queue: SyncQueueItem[] = [];
  private listeners: Array<(queue: SyncQueueItem[]) => void> = [];

  enqueue(entityType: SyncQueueItem['entityType'], entityId: string, operation: SyncQueueItem['operation']): void {
    this.queue.push({
      id: generateId('sync'),
      entityType,
      entityId,
      operation,
      status: 'pending',
      queuedAt: new Date().toISOString(),
    });
    this.notify();
  }

  async flush(isOnline: boolean): Promise<void> {
    if (!isOnline) return;
    // In the prototype there is no remote endpoint to flush to — mock
    // repositories already committed the change locally at call time.
    this.queue = this.queue.map((item) => ({ ...item, status: 'synced' }));
    this.queue = this.queue.filter((item) => item.status !== 'synced');
    this.notify();
  }

  getQueue(): SyncQueueItem[] {
    return this.queue;
  }

  subscribe(listener: (queue: SyncQueueItem[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.queue));
  }
}

export const syncManager = new SyncManager();
