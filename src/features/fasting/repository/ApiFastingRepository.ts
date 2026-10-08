import { FastingRepository } from './FastingRepository';
import { FASTING_METHODS, FastingMethodId, FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';
import { getLocalTimeZone } from '../services/FastingSchedule';
import { ApiFast, fastingApi, isFastAlreadyActiveError, MAX_PLANNED_HOURS } from '@/services/api/fastingApi';
import { LocalStore } from '@/services/storage/LocalStore';
import { ApiError } from '@/utils/apiError';

const HOUR_MS = 3_600_000;

/**
 * App-side detail the backend has no column for (it stores whole
 * `planned_hours` only): the exact planned end of a daily-schedule fast, its
 * eating window, plan link and extension count. Keyed by server fast id. The
 * server remains the source of truth for existence, start, end and status.
 */
interface FastMeta {
  plannedEndTimestamp: string;
  originalPlannedEnd: string;
  eatingHours: number;
  extensionCount: number;
  fastingPlanId: string | null;
}

const metaStore = new LocalStore<Record<string, FastMeta>>('@longlivy/fasting_api_meta', {});

/**
 * Fasting plans and per-day overrides have no backend endpoint yet (see
 * BACKEND_API_REQUIREMENTS.txt). They stay in this device-local store, scoped
 * to the signed-in user's id.
 */
interface PlanDb {
  plans: FastingPlan[];
  planOverrides: FastingPlanDayOverride[];
}
const planStore = new LocalStore<PlanDb>('@longlivy/fasting_plans_api', { plans: [], planOverrides: [] });

function methodFor(type: string): { method: FastingMethodId; category: FastingSession['category']; eatingHours: number } {
  const known = FASTING_METHODS.find((m) => m.id === type);
  if (known) return { method: known.id, category: known.category, eatingHours: known.eatingHours };
  return { method: 'individual', category: 'individual', eatingHours: 0 };
}

/** Whole hours for the server; floored so the server never judges a fast "failed" that the app completed. */
function wholeHours(startIso: string, endIso: string): number {
  const hours = (new Date(endIso).getTime() - new Date(startIso).getTime()) / HOUR_MS;
  const rounded = Math.max(1, Math.floor(hours));
  if (rounded > MAX_PLANNED_HOURS) {
    throw new ApiError({ kind: 'validation', message: `Fasts longer than ${MAX_PLANNED_HOURS} hours can't be saved yet.` });
  }
  return rounded;
}

function toSession(fast: ApiFast, userId: string, meta: FastMeta | undefined): FastingSession {
  const { method, category, eatingHours } = methodFor(fast.fastingType);
  const serverPlannedEnd = new Date(new Date(fast.startedAt).getTime() + fast.plannedHours * HOUR_MS).toISOString();
  const plannedEndTimestamp = meta?.plannedEndTimestamp ?? serverPlannedEnd;
  const startMs = new Date(fast.startedAt).getTime();
  const open = fast.status === 'ongoing';
  const status: FastingSession['status'] = open
    ? (meta?.extensionCount ?? 0) > 0 ? 'extended' : 'active'
    : fast.status === 'completed' ? 'completed' : fast.status === 'cancelled' ? 'cancelled' : 'ended_prematurely';
  return {
    id: fast.id,
    userId,
    fastingPlanId: meta?.fastingPlanId ?? null,
    category,
    method,
    startTimestamp: fast.startedAt,
    plannedEndTimestamp,
    actualEndTimestamp: fast.endedAt,
    plannedDuration: new Date(plannedEndTimestamp).getTime() - startMs,
    actualDuration: fast.endedAt ? new Date(fast.endedAt).getTime() - startMs : null,
    status,
    timezone: getLocalTimeZone(),
    createdAt: fast.createdAt,
    updatedAt: fast.updatedAt,
    originalPlannedEnd: meta?.originalPlannedEnd ?? plannedEndTimestamp,
    extensionCount: meta?.extensionCount ?? 0,
    source: meta?.fastingPlanId ? 'plan' : 'manual',
    eatingHours: meta?.eatingHours ?? eatingHours,
  };
}

export class ApiFastingRepository implements FastingRepository {
  /** Fast ids are server-global, so the overlay doesn't need per-user scoping. */
  private async meta(fastId: string): Promise<FastMeta | undefined> {
    return (await metaStore.read())[fastId];
  }

  private async writeMeta(fastId: string, meta: FastMeta | null): Promise<void> {
    const all = { ...(await metaStore.read()) };
    if (meta) all[fastId] = meta;
    else delete all[fastId];
    await metaStore.write(all);
  }

  private async session(fast: ApiFast, userId: string): Promise<FastingSession> {
    return toSession(fast, userId, await this.meta(fast.id));
  }

  // The FastingRepository contract has no userId on single-session calls; the
  // token already scopes them server-side, so the id is filled in by callers
  // that need it and left empty here.
  private userId = '';

  async getActiveFast(userId: string): Promise<FastingSession | null> {
    this.userId = userId;
    const fast = await fastingApi.active();
    return fast ? this.session(fast, userId) : null;
  }

  async getHistory(userId: string): Promise<FastingSession[]> {
    this.userId = userId;
    const [fasts, meta] = await Promise.all([fastingApi.list(), metaStore.read()]);
    return fasts
      .filter((f) => f.status !== 'ongoing')
      .map((f) => toSession(f, userId, meta[f.id]))
      .sort((a, b) => new Date(b.startTimestamp).getTime() - new Date(a.startTimestamp).getTime());
  }

  async getSession(fastId: string): Promise<FastingSession | null> {
    try {
      return await this.session(await fastingApi.get(fastId), this.userId);
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'not_found') return null;
      throw error;
    }
  }

  /** The server enforces one running fast per user — its 422 maps to `alreadyActive`. */
  async startFast(input: Parameters<FastingRepository['startFast']>[0]): Promise<{ session: FastingSession; alreadyActive: boolean }> {
    this.userId = input.userId;
    try {
      const fast = await fastingApi.start({
        fastingType: input.method,
        plannedHours: wholeHours(input.startTimestamp, input.plannedEndTimestamp),
        startedAt: input.startTimestamp,
      });
      await this.writeMeta(fast.id, {
        plannedEndTimestamp: input.plannedEndTimestamp,
        originalPlannedEnd: input.plannedEndTimestamp,
        eatingHours: input.eatingHours ?? 0,
        extensionCount: 0,
        fastingPlanId: input.fastingPlanId ?? null,
      });
      return { session: await this.session(fast, input.userId), alreadyActive: false };
    } catch (error) {
      if (!isFastAlreadyActiveError(error)) throw error;
      const existing = await fastingApi.active();
      if (!existing) throw error;
      return { session: await this.session(existing, input.userId), alreadyActive: true };
    }
  }

  async endFastPrematurely(fastId: string): Promise<FastingSession> {
    return this.session(await fastingApi.end(fastId), this.userId);
  }

  async completeFast(fastId: string, endedAt?: string): Promise<FastingSession> {
    return this.session(await fastingApi.end(fastId, endedAt), this.userId);
  }

  /**
   * PUT /fasting/{id} cannot move `started_at`. When the start changes, the
   * open fast is replaced: deleted and re-created with the new start (it has
   * no end yet, so no history is lost). A start-preserving edit is a plain PUT.
   */
  async rescheduleFast(fastId: string, changes: Parameters<FastingRepository['rescheduleFast']>[1]): Promise<FastingSession> {
    const current = await fastingApi.get(fastId);
    if (current.status !== 'ongoing') throw new Error('Only a fast that is still running can be rescheduled');
    const plannedHours = wholeHours(changes.startTimestamp, changes.plannedEndTimestamp);
    const meta: FastMeta = {
      plannedEndTimestamp: changes.plannedEndTimestamp,
      originalPlannedEnd: changes.plannedEndTimestamp,
      eatingHours: changes.eatingHours,
      extensionCount: 0,
      fastingPlanId: (await this.meta(fastId))?.fastingPlanId ?? null,
    };
    const startMoved = Math.abs(new Date(current.startedAt).getTime() - new Date(changes.startTimestamp).getTime()) >= 60_000;
    if (!startMoved) {
      const updated = await fastingApi.update(fastId, { fastingType: changes.method, plannedHours });
      await this.writeMeta(fastId, meta);
      return this.session(updated, this.userId);
    }
    await fastingApi.remove(fastId);
    await this.writeMeta(fastId, null);
    const created = await fastingApi.start({ fastingType: changes.method, plannedHours, startedAt: changes.startTimestamp });
    await this.writeMeta(created.id, meta);
    return this.session(created, this.userId);
  }

  async extendFast(fastId: string, newPlannedEndTimestamp: string): Promise<FastingSession> {
    const current = await fastingApi.get(fastId);
    const previous = await this.meta(fastId);
    const updated = await fastingApi.update(fastId, { plannedHours: wholeHours(current.startedAt, newPlannedEndTimestamp) });
    const serverEnd = new Date(new Date(current.startedAt).getTime() + current.plannedHours * HOUR_MS).toISOString();
    await this.writeMeta(fastId, {
      plannedEndTimestamp: newPlannedEndTimestamp,
      originalPlannedEnd: previous?.originalPlannedEnd ?? previous?.plannedEndTimestamp ?? serverEnd,
      eatingHours: previous?.eatingHours ?? methodFor(current.fastingType).eatingHours,
      extensionCount: (previous?.extensionCount ?? 0) + 1,
      fastingPlanId: previous?.fastingPlanId ?? null,
    });
    return this.session(updated, this.userId);
  }

  /** No cancel route exists; a cancelled (discarded) fast is deleted so it never counts toward history or streaks. */
  async cancelFast(fastId: string): Promise<FastingSession> {
    const current = await fastingApi.get(fastId);
    const session = await this.session(current, this.userId);
    await fastingApi.remove(fastId);
    await this.writeMeta(fastId, null);
    const now = new Date().toISOString();
    return { ...session, status: 'cancelled', actualEndTimestamp: now, actualDuration: Date.now() - new Date(session.startTimestamp).getTime(), updatedAt: now };
  }

  async getPlans(userId: string): Promise<FastingPlan[]> {
    return (await planStore.read()).plans.filter((p) => p.userId === userId);
  }

  async savePlan(plan: FastingPlan): Promise<FastingPlan> {
    const db = await planStore.read();
    let plans = db.plans.some((p) => p.id === plan.id) ? db.plans.map((p) => (p.id === plan.id ? plan : p)) : [...db.plans, plan];
    if (plan.active) plans = plans.map((p) => (p.id === plan.id || p.userId !== plan.userId ? p : { ...p, active: false }));
    await planStore.write({ ...db, plans });
    return plan;
  }

  async getPlanOverrides(planId: string): Promise<FastingPlanDayOverride[]> {
    return (await planStore.read()).planOverrides.filter((o) => o.planId === planId);
  }

  async setPlanDayOverride(input: Omit<FastingPlanDayOverride, 'id' | 'createdAt'>): Promise<FastingPlanDayOverride> {
    const db = await planStore.read();
    const override: FastingPlanDayOverride = { ...input, id: `planoverride_${Date.now()}`, createdAt: new Date().toISOString() };
    const planOverrides = [...db.planOverrides.filter((o) => !(o.planId === input.planId && o.date === input.date)), override];
    await planStore.write({ ...db, planOverrides });
    return override;
  }

  async removePlanDayOverride(planId: string, date: string): Promise<void> {
    const db = await planStore.read();
    await planStore.write({ ...db, planOverrides: db.planOverrides.filter((o) => !(o.planId === planId && o.date === date)) });
  }
}
