export interface WeightEntry {
  id: string;
  userId: string;
  timestamp: string;
  weightKg: number;
  source: 'manual' | 'health_platform' | 'wearable';
  measurementMethod?: string;
}

export function weightSourceLabel(source: WeightEntry['source'], t: (key: import('@/localization').TranslationKey) => string): string {
  switch (source) {
    case 'manual':
      return t('enums.weightSource.manual');
    case 'health_platform':
      return t('enums.weightSource.health_platform');
    case 'wearable':
      return t('enums.weightSource.wearable');
  }
}
