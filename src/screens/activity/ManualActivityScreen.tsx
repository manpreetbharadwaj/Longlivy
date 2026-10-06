import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroChip } from '@/components/common/HeroChip';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { activityRepository } from '@/features/activity/repository/MockActivityRepository';
import { ActivityType, ACTIVITY_TYPE_LABELS, SELECTABLE_ACTIVITY_TYPES } from '@/features/activity/models';
import { estimateActivityCalories } from '@/features/activity/services/ActivityCalculator';
import { loadActivityData } from '@/features/activity/activitySlice';
import { selectUserProfile } from '@/features/profile/selectors';
import { DEMO_USER_ID } from '@/mock/demoUser';

export const ManualActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);
  const [type, setType] = useState<ActivityType>('other');
  const [minutes, setMinutes] = useState('30');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    const durationMs = Math.max(0, Number(minutes) || 0) * 60 * 1000;
    const enteredCalories = calories.trim() ? Number(calories) : null;
    const hasEnteredCalories = enteredCalories != null && Number.isFinite(enteredCalories) && enteredCalories >= 0;
    const estimatedCalories = hasEnteredCalories ? enteredCalories : estimateActivityCalories(type, durationMs, profile.weightKg);
    const now = new Date();
    await activityRepository.logManualActivity({
       userId: DEMO_USER_ID,
      type,
      startTimestamp: new Date(now.getTime() - durationMs).toISOString(),
      endTimestamp: now.toISOString(),
      activeDuration: durationMs,
      pauseDuration: 0,
      distanceMeters: null,
      pace: null,
      speed: null,
      calories: estimatedCalories,
       calorieSource: hasEnteredCalories ? 'manual' : 'calculated',
      elevationGainMeters: null,
      route: null,
      gpsAvailable: false,
      source: 'manual',
    });
    setSaving(false);
    dispatch(loadActivityData());
    navigation.goBack();
  }, [type, minutes, calories, dispatch, navigation, profile.weightKg]);

  return (
    <TabHeroLayout title="Log manual activity" onBack={() => navigation.goBack()}>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
        Activity type
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: theme.spacing.xs, marginBottom: theme.spacing.md }}>
        {SELECTABLE_ACTIVITY_TYPES.map((t) => (
          <HeroChip key={t} label={ACTIVITY_TYPE_LABELS[t]} selected={type === t} onPress={() => setType(t)} />
        ))}
      </View>
      <HeroTextField label="Duration (minutes)" value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
      <HeroTextField
        label="Calories (optional — leave blank to estimate)"
        value={calories}
        onChangeText={setCalories}
        keyboardType="numeric"
        style={{ marginBottom: theme.spacing.md }}
      />
      <AppGradientButton label="Save activity" onPress={save} loading={saving} colors={['#6E8FAE', '#3D5266']} />
    </TabHeroLayout>
  );
};
