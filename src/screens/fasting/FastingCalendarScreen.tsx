import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { selectFastingHistory, selectActiveFast } from '@/features/fasting/selectors';

export const FastingCalendarScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const history = useAppSelector(selectFastingHistory);
  const activeFast = useAppSelector(selectActiveFast);

  const dayStatus = useMemo(() => {
    const map = new Map<string, 'completed' | 'ended_prematurely' | 'active'>();
    history.forEach((h) => {
      const key = new Date(h.startTimestamp).toDateString();
      if (h.status === 'completed' || h.status === 'ended_prematurely') map.set(key, h.status);
    });
    if (activeFast) map.set(new Date(activeFast.startTimestamp).toDateString(), 'active');
    return map;
  }, [history, activeFast]);

  const daysInMonth = useMemo(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const days: Date[] = [];
    const cursor = new Date(first);
    while (cursor.getMonth() === now.getMonth()) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, []);

  const colorFor = (status?: string) => {
    if (status === 'completed') return theme.colors.success;
    if (status === 'ended_prematurely') return theme.colors.warning;
    if (status === 'active') return theme.colors.fasting;
    return theme.colors.border;
  };

  return (
    <>
      <AppHeader title="Fasting calendar" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.sm }}>
          {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {daysInMonth.map((day) => {
            const status = dayStatus.get(day.toDateString());
            return (
              <View
                key={day.toISOString()}
                style={{
                  width: '14.28%',
                  aspectRatio: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 4,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: status ? colorFor(status) + '33' : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: status ? 0 : 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <AppText variant="caption" color={status ? colorFor(status) : theme.colors.textTertiary}>
                    {day.getDate()}
                  </AppText>
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', marginTop: theme.spacing.md, flexWrap: 'wrap' }}>
          <LegendDot color={theme.colors.success} label="Completed" />
          <LegendDot color={theme.colors.warning} label="Ended early" />
          <LegendDot color={theme.colors.fasting} label="Active" />
        </View>
      </AppScreen>
    </>
  );
};

const LegendDot: React.FC<{ color: string; label: string }> = ({ color, label }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.md }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginRight: 6 }} />
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
};
