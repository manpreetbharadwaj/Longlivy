export type FeedbackCategory = 'improvement' | 'bug' | 'feature' | 'general';

export interface FeedbackDraft {
  category: FeedbackCategory;
  message: string;
}

export interface FeedbackSubmission {
  id: string;
  userId: string;
  category: FeedbackCategory;
  message: string;
  createdAt: string;
  status: 'submitted';
}
