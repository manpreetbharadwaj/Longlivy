import { FastingRepository } from './FastingRepository';
import { FASTING_METHODS, FastingMethodId, FastingPlan, FastingPlanDayOverride, FastingSession } from '../models';
import { getLocalTimeZone } from '../services/FastingSchedule';
import { ApiFast, ApiFastingPlan, ApiFastingPlanInput, fastingApi, isFastAlreadyActiveError, MAX_PLANNED_HOURS } from '@/services/api/fastingApi';
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
 * Fasting plans are stored in /fasting/plans; this store is the device copy
 * (offline use) plus the local-id -> server-id map. Plan ids stay local
 * because fasts and overrides already reference them. Per-day overrides stay
 * here only: the API has no route to create them (GET/DELETE-by-date only).
 */
interface PlanDb {
  plans: FastingPlan[];
  planOverrides: FastingPlanDayOverride[];
  /** Local plan id -> /fasting/plans id. Absent on data saved before plan sync. */
  planServerIds?: Record<string, string>;
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

function toServerPlan(plan: FastingPlan): ApiFastingPlanInput {
  return {
    method: plan.method,
    category: plan.category,
    recurring: plan.recurring,
    startTime: plan.startTime,
    endTime: plan.endTime,
    weekdays: plan.weekdays,
    // The API stores calendar dates; plans created by FastingService carry a full ISO timestamp.
    startDate: plan.startDate.slice(0, 10),
    endDate: plan.endDate ? plan.endDate.slice(0, 10) : null,
    timezone: plan.timezone,
    active: plan.active,
    fastingHours: plan.fastingHours ?? null,
    eatingHours: plan.eatingHours ?? null,
    notificationSettings: plan.notificationSettings,
  };
}

function fromServerPlan(remote: ApiFastingPlan, base: Pick<FastingPlan, 'id' | 'userId'> & Partial<FastingPlan>): FastingPlan {
  const known = FASTING_METHODS.find((m) => m.id === remote.method);
  return {
    ...base,
    method: (known?.id ?? 'individual') as FastingMethodId,
    category: (remote.category === 'intermittent' || remote.category === 'longer' || remote.category === 'individual' ? remote.category : known?.category ?? 'individual') as FastingPlan['category'],
    recurring: remote.recurring,
    startTime: remote.startTime,
    endTime: remote.endTime,
    weekdays: remote.weekdays,
    startDate: remote.startDate,
    endDate: remote.endDate ?? undefined,
    timezone: remote.timezone,
    active: remote.active,
    fastingHours: remote.fastingHours ?? undefined,
    eatingHours: remote.eatingHours ?? undefined,
    notificationSettings: remote.notificationSettings ?? base.notificationSettings ?? { fastingBegins: true, fastingEnds: true, eatingPhaseBegins: true },
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
      const serverPlanId = input.fastingPlanId ? (await planStore.read()).planServerIds?.[input.fastingPlanId] : undefined;
      const fast = await fastingApi.start({
        fastingType: input.method,
        plannedHours: wholeHours(input.startTimestamp, input.plannedEndTimestamp),
        startedAt: input.startTimestamp,
        fastingPlanId: serverPlanId,
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
    const db = await planStore.read();
    const mine = db.plans.filter((p) => p.userId === userId);
    let server: ApiFastingPlan[];
    try {
      server = await fastingApi.listPlans();
    } catch {
      return mine; // Offline: the device copy is still usable.
    }
    const ids = { ...(db.planServerIds ?? {}) };
    const byServerId = new Map(server.map((p) => [p.id, p]));
    const merged: FastingPlan[] = [];
    for (const plan of mine) {
      const serverId = ids[plan.id];
      const remote = serverId ? byServerId.get(serverId) : undefined;
      if (serverId && !remote) {
        // Deleted on another device.
        delete ids[plan.id];
        continue;
      }
      if (remote) {
        merged.push(fromServerPlan(remote, plan));
        byServerId.delete(remote.id);
        continue;
      }
      // Saved before plan sync (or while offline): upload it now.
      try {
        const saved = await fastingApi.savePlan(null, toServerPlan(plan));
        ids[plan.id] = saved.id;
        merged.push(fromServerPlan(saved, plan));
      } catch {
        merged.push(plan); // Stays local; retried on the next load.
      }
    }
    // Created on another device.
    for (const remote of byServerId.values()) {
      const localId = `plan_server_${remote.id}`;
      ids[localId] = remote.id;
      merged.push(fromServerPlan(remote, { id: localId, userId }));
    }
    const latest = await planStore.read();
    await planStore.write({ ...latest, plans: [...latest.plans.filter((p) => p.userId !== userId), ...merged], planServerIds: ids });
    return merged;
  }

  async savePlan(plan: FastingPlan): Promise<FastingPlan> {
    const db = await planStore.read();
    const ids = { ...(db.planServerIds ?? {}) };
    // Server first, so a save that fails is reported instead of silently diverging.
    const saved = await fastingApi.savePlan(ids[plan.id] ?? null, toServerPlan(plan));
    ids[plan.id] = saved.id;
    const stored = fromServerPlan(saved, plan);
    const current = await planStore.read();
    let plans = current.plans.some((p) => p.id === plan.id) ? current.plans.map((p) => (p.id === plan.id ? stored : p)) : [...current.plans, stored];
    // The server deactivates the user's other plans when one is activated; mirror that locally.
    if (stored.active) plans = plans.map((p) => (p.id === plan.id || p.userId !== plan.userId ? p : { ...p, active: false }));
    await planStore.write({ ...current, plans, planServerIds: ids });
    return stored;
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
    const serverId = (await planStore.read()).planServerIds?.[planId];
    // The API can only list/delete overrides; deleting keeps a server copy (if any) in step.
    if (serverId) await fastingApi.deletePlanOverride(serverId, date).catch(() => undefined);
    const db = await planStore.read();
    await planStore.write({ ...db, planOverrides: db.planOverrides.filter((o) => !(o.planId === planId && o.date === date)) });
  }
}
