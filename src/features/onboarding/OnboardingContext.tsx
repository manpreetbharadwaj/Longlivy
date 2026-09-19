import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { FastingMethodId } from '@/features/fasting/models';

/**
 * Everything onboarding collects to personalize the experience and compute
 * an initial plan. Name/email/password/address are account-creation
 * fields, collected on the Register/Address screens instead. Onboarding
 * asks only what's needed to build the first plan and the goal-appropriate
 * nutrient focus — training frequency/volume, weight-change pace, fasting
 * method, meditation interest and notification preference are all
 * discovered later, inside the feature that actually needs them (e.g.
 * fasting method in the Fasting tab's SelectFastingMethodScreen).
 * `trainingFrequency`/`trainingVolume`/`weightChangePaceKgPerWeek`/
 * `fastingMethod` stay on this type — unused by any onboarding screen now,
 * always `null` here — purely so CompleteSetupScreen's existing fallback
 * defaults and `updateProfile` payload keep working unchanged.
 * `activityLevel` *is* collected again (ActivityLevelStepScreen, Step 6 of
 * 7 — reinstated after initially being dropped).
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
  /** No longer collected during onboarding (see class doc). */
  trainingFrequency: number | null;
  /** No longer collected during onboarding (see class doc). */
  trainingVolume: 'low' | 'moderate' | 'high' | null;
  goal: 'weight_loss' | 'maintenance' | 'muscle_gain' | null;
  /** No longer collected during onboarding (see class doc). */
  weightChangePaceKgPerWeek: number | null;
  /** No longer collected during onboarding (see class doc). */
  fastingMethod: FastingMethodId | null;
  /**
   * Nutrient ids selected on MicronutrientSetupScreen. `null` until that
   * screen is first reached — distinguishes "not visited yet" from "visited
   * and deliberately cleared every suggestion", so its smart defaults are
   * only ever computed once and back-navigation never recomputes over a
   * user's actual choice.
   */
  micronutrients: string[] | null;
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
  micronutrients: null,
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
