export type HistoryCategory = 'fasting' | 'nutrition' | 'activity' | 'weight' | 'meditation';

export interface HistoryItem {
  id: string;
  category: HistoryCategory;
  title: string;
  subtitle: string;
  timestamp: string;
  refId: string;
}
