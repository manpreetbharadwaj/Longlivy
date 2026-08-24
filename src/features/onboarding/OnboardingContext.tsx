import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { FastingMethodId } from '@/features/fasting/models';

/**
 * Everything onboarding collects to personalize the experience and compute
 * an initial plan. Name/email/password/address are account-creation
 * fields, collected on the Register/Address screens instead; meditation
 * interest, nutrition focus and notification preference are all discovered
 * later, inside the feature that actually needs them.
 */
export interface OnboardingDraft {
  gender: 'female' | 'male' | 'diverse' | null;
  /** ISO `yyyy-mm-dd`, the actual captured date of birth — the source of truth for age (see `ageFromDateOfBirth`), not a synthesized placeholder. */
  dateOfBirth: string | null;
  /** Derived from `dateOfBirth` the moment it's set (see `ageFromDateOfBirth`) — kept alongside it so every existing consumer that reads a plain numeric age (the calorie engine, the body visualizer's age-bucket lookup) doesn't need to recompute it. */
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null;
  /** Sessions per week of deliberate exercise — distinct from `activityLevel` (overall daily movement, feeds the calorie multiplier); this is specifically about structured training frequency. */
  trainingFrequency: number | null;
  /** How much ground a typical training session covers — duration/intensity, not just how often. */
  trainingVolume: 'low' | 'moderate' | 'high' | null;
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | null;
  /** Only meaningful (and only asked) when `goal` isn't `'maintenance'` — how fast, not just which direction. */
  weightChangePaceKgPerWeek: number | null;
  /** The user's preferred fasting rhythm, captured as a lightweight onboarding preference — not the same thing as actually starting a fast (that's `startFastThunk` in the Fasting feature) or configuring a full recurring plan (times, weekdays, timezone, notifications — that's `CreateFastingPlan`, reached later from the Fasting tab once the user is ready to schedule something, not asked of someone still creating their account). */
  fastingMethod: FastingMethodId | null;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  gender: null,
  dateOfBirth: null,
  age: null,
  heightCm: null,
  weightKg: null,
  activityLevel: null,
  trainingFrequency: null,
  trainingVolume: null,
  goal: null,
  weightChangePaceKgPerWeek: null,
  fastingMethod: null,
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

/** Whole-years age as of today, from an ISO `yyyy-mm-dd` date of birth. */
export function ageFromDateOfBirth(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear = now.getMonth() > dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

/**
 * Fallback only — used where a real `dateOfBirth` isn't available yet (a
 * profile created before this field existed, or a draft that skipped
 * straight to a screen that needs a date without going through the DOB
 * step). Synthesizes an approximate one (Jan 1 of the corresponding birth
 * year) from a plain age. Prefer the real captured `draft.dateOfBirth`
 * wherever it exists.
 */
export function ageToDateOfBirth(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}
