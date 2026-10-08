import { FastingRepository } from './FastingRepository';
import { FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';
import { FASTING_HISTORY_SEED } from '@/mock/fastingSeed';
import { calculateActualDuration } from '../services/FastingCalculator';
import { getLocalTimeZone } from '../services/FastingSchedule';
import { env } from '@/config/env';
import { ApiFastingRepository } from './ApiFastingRepository';

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
      timezone: getLocalTimeZone(),
      active: true,
      fastingHours: 16,
      eatingHours: 8,
      notificationSettings: { fastingBegins: true, fastingEnds: true, eatingPhaseBegins: true },
    },
  ],
  planOverrides: [],
});

/** A fast that is still open. An extended fast is still running - treating only 'active' as open made an extended fast vanish from the active query and reappear in history while it was still going. */
function isOpen(session: FastingSession): boolean {
  return session.status === 'active' || session.status === 'extended';
}

function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export class MockFastingRepository implements FastingRepository {
  async getActiveFast(userId: string): Promise<FastingSession | null> {
    const db = await store.read();
    const active = db.sessions.find((s) => s.userId === userId && isOpen(s));
    return delay(active ?? null);
  }

  async getHistory(userId: string): Promise<FastingSession[]> {
    const db = await store.read();
    const history = db.sessions
      .filter((s) => s.userId === userId && !isOpen(s) && s.status !== 'planned')
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
    eatingHours?: number;
  }): Promise<{ session: FastingSession; alreadyActive: boolean }> {
    const db = await store.read();
    // The existence check and the write happen against this same `db` read,
    // with no `await` between them — never a second concurrently-active
    // session for this user, even if two starts are triggered back to back.
    // Previously this unconditionally prepended a new 'active' row: a
    // double-tap (or any second start attempt) silently orphaned whatever
    // session was already running, since `getActiveFast` only ever returns
    // the newest one — the orphaned row never went away, and would resurface
    // as "already active" the next time fasting data was loaded.
    const existingActive = db.sessions.find((s) => s.userId === input.userId && isOpen(s));
    if (existingActive) {
      return delay({ session: existingActive, alreadyActive: true });
    }

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
      timezone: getLocalTimeZone(),
      createdAt: now,
      updatedAt: now,
      originalPlannedEnd: input.plannedEndTimestamp,
      extensionCount: 0,
      source: input.fastingPlanId ? 'plan' : 'manual',
      eatingHours: input.eatingHours ?? 0,
    };
    db.sessions = [session, ...db.sessions];
    await store.write(db);
    return delay({ session, alreadyActive: false });
  }

  async endFastPrematurely(id: string): Promise<FastingSession> {
    return this.finalize(id, 'ended_prematurely');
  }

  async completeFast(id: string, endedAt?: string): Promise<FastingSession> {
    return this.finalize(id, 'completed', endedAt ? new Date(endedAt).getTime() : undefined);
  }

  async rescheduleFast(
    id: string,
    changes: { startTimestamp: string; plannedEndTimestamp: string; method: FastingSession['method']; category: FastingSession['category']; eatingHours: number }
  ): Promise<FastingSession> {
    const db = await store.read();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Fasting session not found');
    const session = db.sessions[idx];
    if (!isOpen(session)) throw new Error('Only a fast that is still running can be rescheduled');
    const updated: FastingSession = {
      ...session,
      method: changes.method,
      category: changes.category,
      startTimestamp: changes.startTimestamp,
      plannedEndTimestamp: changes.plannedEndTimestamp,
      originalPlannedEnd: changes.plannedEndTimestamp,
      plannedDuration: new Date(changes.plannedEndTimestamp).getTime() - new Date(changes.startTimestamp).getTime(),
      eatingHours: changes.eatingHours,
      status: 'active',
      extensionCount: 0,
      updatedAt: new Date().toISOString(),
    };
    db.sessions[idx] = updated;
    await store.write(db);
    return delay(updated);
  }

  private async finalize(id: string, status: FastingSession['status'], endedAtMs?: number): Promise<FastingSession> {
    const db = await store.read();
    const idx = db.sessions.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Fasting session not found');
    const now = endedAtMs ?? Date.now();
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
    // One schedule drives the timer at a time: activating a plan retires the others (they stay listed as paused, not deleted).
    if (plan.active) db.plans = db.plans.map((p) => (p.id === plan.id || p.userId !== plan.userId ? p : { ...p, active: false }));
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

export const fastingRepository: FastingRepository = env.useMockApi ? new MockFastingRepository() : new ApiFastingRepository();
