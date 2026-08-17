import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppChip } from '@/components/common/AppChip';
import { AppButton } from '@/components/common/AppButton';
import { AppDateField } from '@/components/common/AppDateField';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { fastingRepository } from '@/features/fasting/repository/MockFastingRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { generateId } from '@/utils/id';
import { FASTING_METHODS, FastingMethodId } from '@/features/fasting/models';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const INTERMITTENT = FASTING_METHODS.filter((m) => m.category === 'intermittent');

function toTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function defaultTime(hours: number, minutes = 0): Date {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

export const CreateFastingPlanScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [method, setMethod] = useState<FastingMethodId>('16:8');
  const [weekdays, setWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState<Date>(defaultTime(20));
  const [endTime, setEndTime] = useState<Date>(defaultTime(12));
  const [saving, setSaving] = useState(false);
  useAppDispatch();

  const toggleDay = useCallback((day: number) => {
    setWeekdays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    await fastingRepository.savePlan({
      id: generateId('plan'),
      userId: DEMO_USER_ID,
      method,
      category: 'intermittent',
      recurring: true,
      startTime: toTimeString(startTime),
      endTime: toTimeString(endTime),
      weekdays,
      startDate: new Date().toISOString(),
      timezone: 'Europe/Berlin',
      active: true,
      notificationSettings: { fastingBegins: true, fastingEnds: true, eatingPhaseBegins: true },
    });
    setSaving(false);
    navigation.goBack();
  }, [method, weekdays, startTime, endTime, navigation]);

  return (
    <>
      <AppHeader title="Recurring fasting plan" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          Method
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md }}>
          {INTERMITTENT.map((m) => (
            <AppChip key={m.id} label={m.name} selected={method === m.id} onPress={() => setMethod(m.id)} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppDateField label="Fasting begins" mode="time" value={startTime} onChange={setStartTime} />
          </View>
          <View style={{ flex: 1 }}>
            <AppDateField label="Eating window starts" mode="time" value={endTime} onChange={setEndTime} />
          </View>
        </View>

        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          Active weekdays
        </AppText>
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
          {WEEKDAYS.map((label, idx) => (
            <AppChip key={idx} label={label} selected={weekdays.includes(idx)} onPress={() => toggleDay(idx)} />
          ))}
        </View>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Changing a single day later will not overwrite this whole recurring plan.
        </AppText>
        <AppButton label="Save plan" onPress={save} loading={saving} />
      </AppScreen>
    </>
  );
};
