import React, { useCallback } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { useAppDispatch } from '@/store/hooks';
import { completeOnboardingThunk } from '@/features/auth/authSlice';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile, setCalorieGoal } from '@/features/calories/calorieSlice';
import { CalorieCalculationEngine } from '@/features/calories/services/CalorieCalculationEngine';

const engine = new CalorieCalculationEngine();

export const CompleteSetupScreen: React.FC = () => {
  const { theme } = useTheme();
  const { draft } = useOnboardingDraft();
  const dispatch = useAppDispatch();

  const finish = useCallback(() => {
    const heightCm = Number(draft.heightCm) || 176;
    const weightKg = Number(draft.weightKg) || 75;
    const age = draft.dateOfBirth ? Math.max(1, Math.floor((Date.now() - new Date(draft.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))) : 30;
    const gender = draft.gender ?? 'diverse';
    const activityLevel = draft.activityLevel ?? 'moderate';

    dispatch(
      updateProfile({
        firstName: draft.firstName || 'Alex',
        lastName: draft.lastName || 'Rivera',
        dateOfBirth: draft.dateOfBirth || '1992-04-18',
        gender,
        heightCm,
        weightKg,
        activityLevel,
        goal: draft.goal ?? 'general_wellness',
      })
    );
    dispatch(setBodyProfile({ age, gender, heightCm, weightKg, activityLevel }));
    const nrla = engine.calculateNrla({ age, gender, heightCm, weightKg, activityLevel });
    dispatch(setCalorieGoal(engine.calculateCalorieGoal(nrla, draft.goal ?? 'general_wellness')));
    dispatch(completeOnboardingThunk());
  }, [dispatch, draft]);

  return (
    <AppScreen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <AppIconTile name="checkmark-circle" shape="circle" color={theme.colors.success} size={64} iconSize={30} />
        </View>
        <AppText variant="displayMedium" align="center" style={{ marginBottom: theme.spacing.md }}>
          You're all set
        </AppText>
        <AppCard>
          <SummaryRow label="Goal" value={draft.goal?.replace('_', ' ') ?? '—'} />
          <SummaryRow label="Activity level" value={draft.activityLevel?.replace('_', ' ') ?? '—'} />
          <SummaryRow label="Fasting method" value={draft.fastingMethod ?? '—'} />
          <SummaryRow label="Meditation" value={draft.meditationInterest ? 'Interested' : 'Skip for now'} />
          <SummaryRow label="Notifications" value={draft.notificationsEnabled ? 'Enabled' : 'Disabled'} last />
        </AppCard>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.md }}>
          Your calorie and macro goals were calculated from this — you can adjust everything anytime.
        </AppText>
      </View>
      <AppButton label="Enter Longlivy" onPress={finish} />
    </AppScreen>
  );
};

const SummaryRow: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};
