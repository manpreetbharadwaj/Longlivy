import { WeightRepository } from './WeightRepository';
import { WeightEntry } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { WEIGHT_SEED } from '@/mock/weightSeed';

const store = new LocalStore<WeightEntry[]>('@longlivy/weight_db', WEIGHT_SEED);

function delay<T>(value: T, ms = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockWeightRepository implements WeightRepository {
  async getHistory(userId: string): Promise<WeightEntry[]> {
    const all = await store.read();
    return delay(
      all
        .filter((w) => w.userId === userId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    );
  }

  async logWeight(userId: string, weightKg: number, source: WeightEntry['source'] = 'manual'): Promise<WeightEntry> {
    const all = await store.read();
    const entry: WeightEntry = { id: generateId('weight'), userId, timestamp: new Date().toISOString(), weightKg, source };
    all.push(entry);
    await store.write(all);
    return delay(entry);
  }
}

export const weightRepository: WeightRepository = new MockWeightRepository();
