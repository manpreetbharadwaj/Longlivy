import { FeedbackDraft, FeedbackSubmission } from '../models';

export interface FeedbackRepository {
  submit(userId: string, draft: FeedbackDraft): Promise<FeedbackSubmission>;
  list(userId: string): Promise<FeedbackSubmission[]>;
}
