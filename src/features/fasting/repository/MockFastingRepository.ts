import { FastingRepository } from './FastingRepository';
import { FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { FASTING_HISTORY_SEED } from '@/mock/fastingSeed';
import { calculateActualDuration } from '../services/FastingCalculator';

interface FastingDb {
  sessions: FastingSession[];
  plans: FastingPlan[];
  planOverrides: FastingPlanDayOverride[];
}

const store = new LocalStore<FastingDb>('@longlivy/fasting_db', {
  sessions: FASTING_HISTORY_SEED,
  plans: [
    {
      id: 'seed_plan_1',
      userId: 'user_demo_1',
      method: '16:8',
      category: 'intermittent',
      recurring: true,
      startTime: '20:00',
      endTime: '12:00',
      weekdays: [0, 1, 2, 3, 4, 5, 6],
      startDate: new Date().toISOString(),
      timezone: 'Europe/Berlin',
      active: true,
      notificationSettings: { fastingBegins: true, fastingEnds: true, eatingPhaseBegins: true },
    },
  ],
  planOverrides: [],
});

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockFastingRepository implements FastingRepository {
  async getActiveFast(userId: string): Promise<FastingSession | null> {
    const db = await store.read();
    const active = db.sessions.find((s) => s.userId === userId && s.status === 'active');
    return delay(active ?? null);
  }

  async getHistory(userId: string): Promise<FastingSession[]> {
    const db = await store.read();
    const history = db.sessions
      .filter((s) => s.userId === userId && s.status !== 'active' && s.status !== 'planned')
      .sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
    return delay(history);
  }

  async getSession(id: string): Promise<FastingSession | null> {
    const db = await store.read();
    return delay(db.sessions.find((s) => s.id === id) ?? null);
  }

  async startFast(input: {
    userId: string;
    method: FastingSession['method'];
    category: FastingSession['category'];
    startTimestamp: string;
    plannedEndTimestamp: string;
    fastingPlanId?: string | null;
  }): Promise<FastingSession> {
    const db = await store.read();
    const now = new Date().toISOString();
    const session: FastingSession = {
      id: generateId('fast'),
      userId: input.userId,
      fastingPlanId: input.fastingPlanId ?? null,
      category: input.category,
      method: input.method,
      startTimestamp: input.startTimestamp,
      plannedEndTimestamp: input.plannedEndTimestamp,
      actualEndTimestamp: null,
      plannedDuration:
        new Date(input.plannedEndTimestamp).getTime() - new Date(input.startTimestamp).getTime(),
      actualDuration: null,
      status: 'active',
      timezone: 'Europe/Berlin',
      createdAt: now,
      updatedAt: now,
      originalPlannedEnd: input.plannedEndTimestamp,
      extensionCount: 0,
      source: input.fastingPlanId ? 'plan' : 'manual',
    };
    db.sessions = [session, ...db.sessions];
    await store.write(db);
    return delay(session);
  }

  async endFastPrematurely(id: string): Promise<FastingSession> {
    return this.finalize(id, 'ended_prematurely');
  }

  async completeFast(id: string): Promise<FastingSession> {
    return this.finalize(id, 'completed');
  }

  private async finalize(id: string, status: FastingSession['status']): Promise<FastingSession> {
    const db = await store.read();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Fasting session not found');
    const now = Date.now();
    const session = db.sessions[idx];
    const updated: FastingSession = {
      ...session,
      status,
      actualEndTimestamp: new Date(now).toISOString(),
      actualDuration: calculateActualDuration(session, now),
      updatedAt: new Date(now).toISOString(),
    };
    db.sessions[idx] = updated;
    await store.write(db);
    return delay(updated);
  }

  async extendFast(id: string, newPlannedEndTimestamp: string): Promise<FastingSession> {
    const db = await store.read();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Fasting session not found');
    const session = db.sessions[idx];
    const updated: FastingSession = {
      ...session,
      plannedEndTimestamp: newPlannedEndTimestamp,
      plannedDuration:
        new Date(newPlannedEndTimestamp).getTime() - new Date(session.startTimestamp).getTime(),
      status: 'extended',
      extensionCount: session.extensionCount + 1,
      updatedAt: new Date().toISOString(),
      // originalPlannedEnd is preserved intentionally
    };
    db.sessions[idx] = updated;
    await store.write(db);
    return delay(updated);
  }

  async cancelFast(id: string): Promise<FastingSession> {
    return this.finalize(id, 'cancelled');
  }

  async getPlans(userId: string): Promise<FastingPlan[]> {
    const db = await store.read();
    return delay(db.plans.filter((p) => p.userId === userId));
  }

  async savePlan(plan: FastingPlan): Promise<FastingPlan> {
    const db = await store.read();
    const idx = db.plans.findIndex((p) => p.id === plan.id);
    if (idx === -1) db.plans.push(plan);
    else db.plans[idx] = plan;
    await store.write(db);
    return delay(plan);
  }

  async getPlanOverrides(planId: string): Promise<FastingPlanDayOverride[]> {
    const db = await store.read();
    return delay(db.planOverrides.filter((o) => o.planId === planId));
  }

  async setPlanDayOverride(input: Omit<FastingPlanDayOverride, 'id' | 'createdAt'>): Promise<FastingPlanDayOverride> {
    const db = await store.read();
    const existingIdx = db.planOverrides.findIndex((o) => o.planId === input.planId && o.date === input.date);
    const override: FastingPlanDayOverride = { ...input, id: generateId('planoverride'), createdAt: new Date().toISOString() };
    if (existingIdx === -1) db.planOverrides.push(override);
    else db.planOverrides[existingIdx] = override;
    await store.write(db);
    return delay(override);
  }

  async removePlanDayOverride(planId: string, date: string): Promise<void> {
    const db = await store.read();
    db.planOverrides = db.planOverrides.filter((o) => !(o.planId === planId && o.date === date));
    await store.write(db);
    return delay(undefined);
  }
}

export const fastingRepository: FastingRepository = new MockFastingRepository();
