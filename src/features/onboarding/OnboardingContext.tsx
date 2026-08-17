import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { DEMO_USER } from '@/mock/demoUser';

export interface OnboardingDraft {
  goal: 'weight_loss' | 'maintenance' | 'general_wellness' | 'muscle_gain' | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'diverse' | null;
  heightCm: string;
  weightKg: string;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  nutritionFocus: 'balanced' | 'high_protein' | 'low_carb' | null;
  fastingMethod: '16:8' | '18:6' | '24h' | 'none_yet' | null;
  meditationInterest: boolean;
  notificationsEnabled: boolean;
}

/**
 * Seeded from the already-known demo profile rather than left blank — if
 * this information already exists, onboarding shouldn't ask for it again
 * from scratch. Every field stays fully editable; this only changes the
 * starting point.
 */
const DEFAULT_DRAFT: OnboardingDraft = {
  goal: DEMO_USER.goal,
  firstName: DEMO_USER.firstName,
  lastName: DEMO_USER.lastName,
  dateOfBirth: DEMO_USER.dateOfBirth,
  gender: DEMO_USER.gender,
  heightCm: String(DEMO_USER.heightCm),
  weightKg: String(DEMO_USER.weightKg),
  activityLevel: DEMO_USER.activityLevel,
  nutritionFocus: null,
  fastingMethod: null,
  meditationInterest: true,
  notificationsEnabled: true,
};

interface OnboardingContextValue {
  draft: OnboardingDraft;
  update: (patch: Partial<OnboardingDraft>) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);
  const update = useCallback((patch: Partial<OnboardingDraft>) => setDraft((prev) => ({ ...prev, ...patch })), []);
  const value = useMemo(() => ({ draft, update }), [draft, update]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export function useOnboardingDraft(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingDraft must be used within OnboardingProvider');
  return ctx;
}
