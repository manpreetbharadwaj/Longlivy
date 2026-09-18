import { useMemo } from 'react';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { buildGoalFlow, COMMON_STEP_COUNT } from './flow';
import { FlowStep } from './types';

/**
 * The single place that turns `draft.selectedGoals`/`draft.primaryGoal`
 * into the live, ordered goal-specific flow — recomputed via `useMemo`
 * whenever either changes, so it's always safe to read: if the user goes
 * back to goal selection and changes their mind, every screen that calls
 * this hook sees the recalculated flow on its very next render, with no
 * manual reset required anywhere.
 */
export function useGoalFlow(): { flow: FlowStep[]; totalSteps: number } {
  const { draft } = useOnboardingDraft();
  const flow = useMemo(() => buildGoalFlow(draft.selectedGoals ?? [], draft.primaryGoal), [draft.selectedGoals, draft.primaryGoal]);
  return { flow, totalSteps: COMMON_STEP_COUNT + flow.length };
}
