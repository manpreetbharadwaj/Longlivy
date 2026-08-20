import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

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
 * Every identity/personal field starts genuinely empty — onboarding must
 * not pre-fill a real (or demo) person's name, birthdate, gender or body
 * measurements into the form; the user should have to type or pick each
 * one themselves. `meditationInterest`/`notificationsEnabled` are plain
 * preference toggles (not personal data) and keep sensible opt-in defaults.
 */
const DEFAULT_DRAFT: OnboardingDraft = {
  goal: null,
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: null,
  heightCm: '',
  weightKg: '',
  activityLevel: null,
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
