import { Meditation, MeditationSession, MeditationSessionEvent, MeditationTemplate, MeditationReminder, BreathingScheme, SessionEventType } from '../models';

export interface MeditationRepository {
  getPublishedContent(): Promise<Meditation[]>;
  getBreathingSchemes(): Promise<BreathingScheme[]>;
  getFavorites(userId: string): Promise<string[]>;
  toggleFavorite(userId: string, meditationId: string): Promise<string[]>;
  getTemplates(userId: string): Promise<MeditationTemplate[]>;
  saveTemplate(template: MeditationTemplate): Promise<MeditationTemplate>;
  deleteTemplate(id: string): Promise<void>;

  getReminders(userId: string): Promise<MeditationReminder[]>;
  saveReminder(reminder: MeditationReminder): Promise<MeditationReminder>;
  deleteReminder(id: string): Promise<void>;

  startSession(input: {
    userId: string;
    meditationId: string | null;
    meditationTitle: string;
    type: MeditationSession['type'];
    plannedDurationSeconds: number;
    templateId?: string | null;
  }): Promise<MeditationSession>;
  recordEvent(sessionId: string, type: SessionEventType): Promise<MeditationSessionEvent>;
  completeSession(sessionId: string, activeDurationSeconds: number, pausedDurationSeconds: number, status: MeditationSession['status']): Promise<MeditationSession>;
  getHistory(userId: string): Promise<MeditationSession[]>;
}
