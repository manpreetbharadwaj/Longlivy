import React, { useCallback, useEffect, useState } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppInput } from '@/components/common/AppInput';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { AppErrorState } from '@/components/common/AppErrorState';
import { AppLoader } from '@/components/common/AppLoader';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectAllGoals,
  selectGoalsError,
  selectGoalsMutationError,
  selectGoalsMutationStatus,
  selectGoalsStatus,
} from '@/features/goals/selectors';
import { fetchGoalsThunk, updateGoalThunk, deleteGoalThunk } from '@/features/goals/goalsSlice';

export const GoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const goals = useAppSelector(selectAllGoals);
  const status = useAppSelector(selectGoalsStatus);
  const error = useAppSelector(selectGoalsError);
  const mutationStatus = useAppSelector(selectGoalsMutationStatus);
  const mutationError = useAppSelector(selectGoalsMutationError);
  const [targetDrafts, setTargetDrafts] = useState<Record<string, string>>({});

  const loadGoals = useCallback(() => {
    void dispatch(fetchGoalsThunk());
  }, [dispatch]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Draft text remains editable while a PUT is in flight, but is reset to the
  // Redux/server value when that request succeeds or fails.
  useEffect(() => {
    if (mutationStatus === 'loading') return;
    setTargetDrafts((previous) => {
      const next: Record<string, string> = {};
      goals.forEach((goal) => {
        next[goal.id] = previous[goal.id] ?? String(goal.target);
      });
      return next;
    });
  }, [goals, mutationStatus]);

  const updateTarget = useCallback(
    (id: string) => {
      const value = Number(targetDrafts[id]);
      if (!Number.isFinite(value)) return;
      void dispatch(updateGoalThunk({ id, changes: { target: value, source: 'manual' } }));
    },
    [dispatch, targetDrafts]
  );

  const toggle = useCallback(
    (id: string, active: boolean) => {
      void dispatch(updateGoalThunk({ id, changes: { active: !active } }));
    },
    [dispatch]
  );

  const confirmDelete = useCallback(
    (id: string, label: string) => {
      Alert.alert(`Delete the ${label} goal?`, 'Its progress history is deleted with it.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => void dispatch(deleteGoalThunk(id)) },
      ]);
    },
    [dispatch],
  );

  const isInitialLoading = status === 'loading' && goals.length === 0;
  const isEmpty = status === 'succeeded' && goals.length === 0;
  const isError = status === 'failed' && goals.length === 0;

  return (
    <>
      <AppHeader title={t('history.allGoals')} onBack={() => navigation.goBack()} />
      <AppScreen refreshing={status === 'loading'} onRefresh={loadGoals}>
        {isInitialLoading ? <AppLoader label="Loading goals…" /> : null}
        {isError ? <AppErrorState message={error ?? undefined} onRetry={loadGoals} /> : null}
        {isEmpty ? <AppEmptyState title={t('states.emptyTitle')} message="Create a goal to start tracking your progress." /> : null}
        {mutationError ? (
          <AppText color={theme.colors.danger} style={{ marginBottom: theme.spacing.sm }}>
            {mutationError}
          </AppText>
        ) : null}
        {!isInitialLoading && !isError && !isEmpty
          ? goals.map((goal) => (
              <AppCard key={goal.id} style={{ marginBottom: theme.spacing.sm }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                  <AppText variant="headingSmall" style={{ textTransform: 'capitalize' }}>
                    {goal.type.replace(/_/g, ' ')}
                  </AppText>
                  <AppSwitch value={goal.active} onValueChange={() => toggle(goal.id, goal.active)} disabled={mutationStatus === 'loading'} />
                </View>
                <AppInput
                  value={targetDrafts[goal.id] ?? String(goal.target)}
                  onChangeText={(value) => setTargetDrafts((previous) => ({ ...previous, [goal.id]: value }))}
                  onEndEditing={() => updateTarget(goal.id)}
                  keyboardType="numeric"
                  editable={goal.active && mutationStatus !== 'loading'}
                  label={`Target (${goal.unit}, per ${goal.period})`}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xxs }}>
                  <AppText variant="caption" color={theme.colors.textTertiary} style={{ flex: 1 }}>
                    Source: {goal.source}
                  </AppText>
                  {/* Nutrition targets are managed (and recalculated) on the Nutrition goals screen. */}
                  {String(goal.type).startsWith('nutrition_') ? null : (
                    <Pressable onPress={() => confirmDelete(goal.id, String(goal.type).replace(/_/g, ' '))} disabled={mutationStatus === 'loading'} accessibilityRole="button" hitSlop={8}>
                      <AppText variant="caption" color={theme.colors.danger}>
                        Delete goal
                      </AppText>
                    </Pressable>
                  )}
                </View>
              </AppCard>
            ))
          : null}
      </AppScreen>
    </>
  );
};
