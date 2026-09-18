import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { HeroChip } from '@/components/common/HeroChip';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useSelectionHaptic } from '@/hooks/useSelectionHaptic';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { getGoalConfig } from '@/features/onboarding/goals/goalConfig';
import { useGoalFlow } from '@/features/onboarding/goals/useGoalFlow';
import { navigateToFlowStep, COMMON_STEP_COUNT } from '@/features/onboarding/goals/flow';
import { OnboardingStepLayout } from './OnboardingStepLayout';

type GoalQuestionRoute = RouteProp<OnboardingStackParamList, 'GoalQuestion'>;

/**
 * One generic goal-specific question — the entire fitness/activity/yoga/
 * meditation/fasting/nutrition/overall flow is this single component,
 * rendering whichever `GoalQuestionConfig` its `key` param points to (see
 * `GOALS` in `goalConfig.ts`). There is no per-goal screen file: adding or
 * changing a question is a config edit, not a new route.
 */
export const GoalQuestionScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const route = useRoute<GoalQuestionRoute>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, setGoalAnswer } = useOnboardingDraft();
  const fireHaptic = useSelectionHaptic();
  const { flow, totalSteps } = useGoalFlow();

  const index = flow.findIndex((s) => s.key === route.params.key);
  const step = flow[index];
  // Should always be a 'question' step — GoalQuestion is only ever pushed
  // for one (see `navigateToFlowStep`) — but guard defensively in case the
  // flow shrank underneath an already-pushed screen (e.g. the user reopened
  // a much-earlier screen's state via fast back-navigation).
  if (!step || step.kind !== 'question') {
    return null;
  }

  const config = getGoalConfig(step.goalKey);
  const question = step.question;
  const accent = config?.accent ?? theme.colors.primary;
  const selectedIds = draft.goalAnswers[step.goalKey]?.[question.id] ?? [];

  const toggle = (optionId: string) => {
    fireHaptic();
    if (question.multiSelect) {
      const next = selectedIds.includes(optionId) ? selectedIds.filter((id) => id !== optionId) : [...selectedIds, optionId];
      setGoalAnswer(step.goalKey, question.id, next);
    } else {
      setGoalAnswer(step.goalKey, question.id, [optionId]);
    }
  };

  return (
    <OnboardingStepLayout
      step={COMMON_STEP_COUNT + index + 1}
      totalSteps={totalSteps}
      title={t(question.titleKey)}
      subtitle={question.subtitleKey ? t(question.subtitleKey) : undefined}
      onNext={() => navigateToFlowStep(navigation, flow[index + 1])}
      onBack={() => navigation.goBack()}
      nextDisabled={selectedIds.length === 0}
    >
      <FadeSlideIn delay={motion.staggerStepMs}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {question.options.map((option) => (
            <View key={option.id} style={{ marginBottom: theme.spacing.xs }}>
              <HeroChip label={t(option.labelKey)} selected={selectedIds.includes(option.id)} activeColor={accent} onPress={() => toggle(option.id)} />
            </View>
          ))}
        </View>
      </FadeSlideIn>
    </OnboardingStepLayout>
  );
};
