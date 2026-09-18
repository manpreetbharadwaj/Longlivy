import { FeedbackRepository } from './FeedbackRepository';
import { FeedbackDraft, FeedbackSubmission } from '../models';
import { LocalStore } from '@/services/storage/LocalStore';
import { generateId } from '@/utils/id';

const store = new LocalStore<FeedbackSubmission[]>('@app/feedback_db', []);

function delay<T>(value: T, ms = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Local-only mock — persists submissions so they survive an app restart, with no real backend behind it yet. Swap for a real API-backed implementation of `FeedbackRepository` later. */
export class MockFeedbackRepository implements FeedbackRepository {
  async submit(userId: string, draft: FeedbackDraft): Promise<FeedbackSubmission> {
    const all = await store.read();
    const submission: FeedbackSubmission = {
      id: generateId('feedback'),
      userId,
      category: draft.category,
      message: draft.message,
      createdAt: new Date().toISOString(),
      status: 'submitted',
    };
    all.push(submission);
    await store.write(all);
    return delay(submission);
  }

  async list(userId: string): Promise<FeedbackSubmission[]> {
    const all = await store.read();
    return delay(all.filter((f) => f.userId === userId));
  }
}

export const feedbackRepository: FeedbackRepository = new MockFeedbackRepository();
