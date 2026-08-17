import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppButton } from '@/components/common/AppButton';
import { AppDateField } from '@/components/common/AppDateField';
import { useTheme } from '@/hooks/useTheme';

interface LocalReminder {
  id: string;
  time: string;
  enabled: boolean;
}

function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const MeditationRemindersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [reminders, setReminders] = useState<LocalReminder[]>([
    { id: 'r1', time: '07:30', enabled: true },
    { id: 'r2', time: '21:00', enabled: false },
  ]);
  const [newTime, setNewTime] = useState(new Date());

  const toggle = useCallback((id: string) => {
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }, []);

  const add = useCallback(() => {
    setReminders((prev) => [...prev, { id: `r${prev.length + 1}`, time: dateToTime(newTime), enabled: true }]);
  }, [newTime]);

  return (
    <>
      <AppHeader title="Reminders" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Reminders never count as a completed meditation — they're just a nudge.
        </AppText>
        {reminders.map((r) => (
          <AppCard key={r.id} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="headingSmall">{r.time}</AppText>
              <AppSwitch value={r.enabled} onValueChange={() => toggle(r.id)} />
            </View>
          </AppCard>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: theme.spacing.sm }}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppDateField label="New reminder time" mode="time" value={newTime} onChange={setNewTime} />
          </View>
          <AppButton label="Add" onPress={add} fullWidth={false} style={{ paddingHorizontal: theme.spacing.lg, height: 52 }} />
        </View>
      </AppScreen>
    </>
  );
};
