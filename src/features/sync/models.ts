export type SyncStatus = 'synced' | 'pending' | 'failed' | 'conflict';

export interface SyncQueueItem {
  id: string;
  entityType: 'fasting' | 'activity' | 'nutrition' | 'meditation' | 'weight';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  status: SyncStatus;
  queuedAt: string;
}
