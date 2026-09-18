import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { GOALS } from './goalConfig';
import { FlowStep, GoalKey } from './types';

/** Number of screens in "Essential Common Information" (PersonalizeMe → Gender → Age → Height → Weight → ActivityLevelStep) — every one of them is asked regardless of goals, so they own the first 6 numbered steps; goal-specific steps continue the count from there. */
export const COMMON_STEP_COUNT = 6;

/** `FlowStep.key` for nutrition's reused Micronutrients screen — shared between `buildGoalFlow` (which creates it) and `MicronutrientSetupScreen` (which looks up its own position by it), so the string only lives in one place. */
export const NUTRITION_SCREEN_KEY = 'nutrition.screen';

/**
 * Turns a user's selected goals into the ordered list of goal-specific
 * screens they'll actually see — the primary goal's questions first (per
 * spec), then each remaining selected goal's questions in the canonical
 * `GOALS` registry order (deterministic regardless of tap order, since the
 * spec only requires the primary to come first). Pure and re-run on every
 * render via `useGoalFlow`'s `useMemo`, so a goal change anywhere upstream
 * (e.g. the user goes back and deselects a goal) is picked up automatically
 * — nothing needs to manually invalidate a cached flow.
 */
export function buildGoalFlow(selectedGoals: GoalKey[], primaryGoal: GoalKey | null): FlowStep[] {
  if (selectedGoals.length === 0) return [];
  const primary = primaryGoal && selectedGoals.includes(primaryGoal) ? primaryGoal : selectedGoals[0];
  const orderedKeys = [primary, ...GOALS.map((g) => g.key).filter((k) => selectedGoals.includes(k) && k !== primary)];

  const steps: FlowStep[] = [];
  for (const goalKey of orderedKeys) {
    const config = GOALS.find((g) => g.key === goalKey);
    if (!config) continue;
    for (const question of config.questions) {
      steps.push({ kind: 'question', key: `${goalKey}.${question.id}`, goalKey, question });
    }
    if (config.extraRouteName) {
      steps.push({ kind: 'screen', key: `${goalKey}.screen`, goalKey, routeName: config.extraRouteName });
    }
  }
  return steps;
}

/**
 * Advances from one flow position to the next — shared by ActivityLevelStep
 * (entering the flow, `next` = `flow[0]`) and every step inside it
 * (`next` = `flow[index + 1]`). `undefined` means the flow is exhausted,
 * which lands on the personalization summary.
 */
export function navigateToFlowStep(navigation: NativeStackNavigationProp<OnboardingStackParamList>, next: FlowStep | undefined): void {
  if (!next) {
    navigation.navigate('GoalSummary');
    return;
  }
  if (next.kind === 'screen') {
    navigation.navigate(next.routeName);
    return;
  }
  // `push`, not `navigate` — this route is reached many times with
  // different params in one flow, and `push` always adds a fresh stack
  // entry (so Back correctly steps to the *previous* question) instead of
  // re-focusing an already-mounted instance of the same route name.
  navigation.push('GoalQuestion', { key: next.key });
}
