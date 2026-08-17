import { FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';

/**
 * Repository interface. UI/Redux never talk to a concrete implementation
 * directly — only through this contract. Swap MockFastingRepository for an
 * ApiFastingRepository later without touching screens or slices.
 */
export interface FastingRepository {
  getActiveFast(userId: string): Promise<FastingSession | null>;
  getHistory(userId: string): Promise<FastingSession[]>;
  getSession(id: string): Promise<FastingSession | null>;
  startFast(input: {
    userId: string;
    method: FastingSession['method'];
    category: FastingSession['category'];
    startTimestamp: string;
    plannedEndTimestamp: string;
    fastingPlanId?: string | null;
  }): Promise<FastingSession>;
  endFastPrematurely(id: string): Promise<FastingSession>;
  completeFast(id: string): Promise<FastingSession>;
  extendFast(id: string, newPlannedEndTimestamp: string): Promise<FastingSession>;
  cancelFast(id: string): Promise<FastingSession>;
  getPlans(userId: string): Promise<FastingPlan[]>;
  savePlan(plan: FastingPlan): Promise<FastingPlan>;
  getPlanOverrides(planId: string): Promise<FastingPlanDayOverride[]>;
  setPlanDayOverride(input: Omit<FastingPlanDayOverride, 'id' | 'createdAt'>): Promise<FastingPlanDayOverride>;
  removePlanDayOverride(planId: string, date: string): Promise<void>;
}
