import { WeightRepository } from './WeightRepository';
import { WeightEntry } from '../models';
import { weightApi } from '@/services/api/weightApi';

/** Backed by `/weight-logs`. The server scopes every record to the bearer token's user. */
export class ApiWeightRepository implements WeightRepository {
  async getHistory(userId: string): Promise<WeightEntry[]> {
    this.userId = userId;
    const entries = await weightApi.list(userId);
    // Same ordering contract as the mock: oldest first.
    return entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private userId = '';

  logWeight(userId: string, weightKg: number, source: WeightEntry['source'] = 'manual'): Promise<WeightEntry> {
    this.userId = userId;
    return weightApi.create(userId, weightKg, source);
  }

  updateEntry(id: string, weightKg: number): Promise<WeightEntry> {
    return weightApi.update(this.userId, id, weightKg);
  }

  deleteEntry(id: string): Promise<void> {
    return weightApi.remove(id);
  }
}
