import { WeightEntry } from '../models';

export interface WeightRepository {
  getHistory(userId: string): Promise<WeightEntry[]>;
  logWeight(userId: string, weightKg: number, source?: WeightEntry['source']): Promise<WeightEntry>;
}
