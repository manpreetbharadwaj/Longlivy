import { FastingRepository } from '../repository/FastingRepository';
import { FastingMethodId, FastingSession, FASTING_METHODS, LONGER_FASTING_THRESHOLD_HOURS } from '../models';

/**
 * Use-case layer: orchestrates repository calls + business rules.
 * Redux thunks call into this service; the service never imports React
 * Native or Redux, so it stays unit-testable in isolation.
 */
export class FastingService {
  constructor(private repository: FastingRepository) {}

  async getActiveFast(userId: string) {
    return this.repository.getActiveFast(userId);
  }

  async getHistory(userId: string) {
    return this.repository.getHistory(userId);
  }

  async startFast(userId: string, methodId: FastingMethodId, customHours?: number): Promise<{ session: FastingSession; alreadyActive: boolean }> {
    const method = FASTING_METHODS.find((m) => m.id === methodId);
    if (!method) throw new Error(`Unknown fasting method: ${methodId}`);

    const start = new Date();
    const hours = methodId === 'individual' ? customHours ?? 16 : method.fastingHours;
    const plannedEnd = new Date(start.getTime() + hours * 60 * 60 * 1000);

    return this.repository.startFast({
      userId,
      method: methodId,
      category: method.category,
      startTimestamp: start.toISOString(),
      plannedEndTimestamp: plannedEnd.toISOString(),
    });
  }

  async endFastNow(session: FastingSession): Promise<FastingSession> {
    const isOnOrAfterPlannedEnd = Date.now() >= new Date(session.plannedEndTimestamp).getTime();
    return isOnOrAfterPlannedEnd
      ? this.repository.completeFast(session.id)
      : this.repository.endFastPrematurely(session.id);
  }

  async extendFast(sessionId: string, additionalHours: number, currentPlannedEnd: string): Promise<FastingSession> {
    const newEnd = new Date(new Date(currentPlannedEnd).getTime() + additionalHours * 60 * 60 * 1000);
    return this.repository.extendFast(sessionId, newEnd.toISOString());
  }

  async cancelFast(sessionId: string): Promise<FastingSession> {
    return this.repository.cancelFast(sessionId);
  }

  requiresSafetyNotice(methodId: FastingMethodId): boolean {
    const method = FASTING_METHODS.find((m) => m.id === methodId);
    return !!method && method.fastingHours >= LONGER_FASTING_THRESHOLD_HOURS;
  }
}
