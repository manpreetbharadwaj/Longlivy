import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { AppChip } from '@/components/common/AppChip';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { activityRepository } from '@/features/activity/repository/MockActivityRepository';
import { ActivityType, ACTIVITY_TYPE_LABELS } from '@/features/activity/models';
import { estimateActivityCalories } from '@/features/activity/services/ActivityCalculator';
import { DEMO_USER } from '@/mock/demoUser';
import { loadActivityData } from '@/features/activity/activitySlice';

export const ManualActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const [type, setType] = useState<ActivityType>('other');
  const [minutes, setMinutes] = useState('30');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    setSaving(true);
    const durationMs = (Number(minutes) || 0) * 60 * 1000;
    const estimatedCalories = calories ? Number(calories) : estimateActivityCalories(type, durationMs, DEMO_USER.weightKg);
    const now = new Date();
    await activityRepository.logManualActivity({
      userId: DEMO_USER.id,
      type,
      startTimestamp: new Date(now.getTime() - durationMs).toISOString(),
      endTimestamp: now.toISOString(),
      activeDuration: durationMs,
      pauseDuration: 0,
      distanceMeters: null,
      pace: null,
      speed: null,
      calories: estimatedCalories,
      calorieSource: calories ? 'manual' : 'calculated',
      elevationGainMeters: null,
      route: null,
      gpsAvailable: false,
      source: 'manual',
    });
    setSaving(false);
    dispatch(loadActivityData());
    navigation.goBack();
  }, [type, minutes, calories, dispatch, navigation]);

  return (
    <>
      <AppHeader title="Log manual activity" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          Activity type
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
          {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => (
            <AppChip key={t} label={ACTIVITY_TYPE_LABELS[t]} selected={type === t} onPress={() => setType(t)} />
          ))}
        </View>
        <AppInput label="Duration (minutes)" value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
        <AppInput label="Calories (optional — leave blank to estimate)" value={calories} onChangeText={setCalories} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />
        <AppButton label="Save activity" onPress={save} loading={saving} />
      </AppScreen>
    </>
  );
};
