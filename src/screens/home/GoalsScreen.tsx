import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppInput } from '@/components/common/AppInput';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectAllGoals } from '@/features/goals/selectors';
import { toggleGoal, upsertGoal } from '@/features/goals/goalsSlice';

export const GoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectAllGoals);

  const setTarget = useCallback(
    (id: string, value: string) => {
      const goal = goals.find((g) => g.id === id);
      if (goal) dispatch(upsertGoal({ ...goal, target: Number(value) || 0, source: 'manual' }));
    },
    [dispatch, goals]
  );

  return (
    <>
      <AppHeader title={t('history.allGoals')} onBack={() => navigation.goBack()} />
      <AppScreen>
        {goals.map((goal) => (
          <AppCard key={goal.id} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <AppText variant="headingSmall" style={{ textTransform: 'capitalize' }}>
                {goal.type.replace(/_/g, ' ')}
              </AppText>
              <AppSwitch value={goal.active} onValueChange={() => dispatch(toggleGoal(goal.id))} />
            </View>
            <AppInput
              value={String(goal.target)}
              onChangeText={(v) => setTarget(goal.id, v)}
              keyboardType="numeric"
              editable={goal.active}
              label={`Target (${goal.unit}, per ${goal.period})`}
            />
            <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.xxs }}>
              Source: {goal.source}
            </AppText>
          </AppCard>
        ))}
      </AppScreen>
    </>
  );
};
