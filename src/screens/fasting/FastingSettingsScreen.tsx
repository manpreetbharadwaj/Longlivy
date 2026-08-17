import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotificationSettings } from '@/features/notifications/selectors';
import { toggleNotificationSetting } from '@/features/notifications/notificationSlice';

const FASTING_EVENT_TYPES = [
  'fasting_begins',
  'fasting_ends',
  'eating_phase_begins',
  'interim_goal_achieved',
  'fasting_almost_over',
  'planned_fast_not_started',
  'fasting_streak_reached',
  'personal_best_achieved',
] as const;

export const FastingSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectNotificationSettings).filter((s) => FASTING_EVENT_TYPES.includes(s.type as any));

  const toggle = useCallback((type: (typeof FASTING_EVENT_TYPES)[number]) => dispatch(toggleNotificationSetting(type)), [dispatch]);

  return (
    <>
      <AppHeader title="Fasting settings" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.sm }}>
          Notifications
        </AppText>
        <AppCard>
          {settings.map((s, idx) => (
            <View
              key={s.type}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: theme.spacing.xs,
                borderBottomWidth: idx < settings.length - 1 ? 1 : 0,
                borderBottomColor: theme.colors.divider,
              }}
            >
              <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                <AppText variant="bodyMedium">{s.label}</AppText>
                <AppText variant="caption" color={theme.colors.textSecondary}>
                  {s.description}
                </AppText>
              </View>
              <AppSwitch value={s.enabled} onValueChange={() => toggle(s.type as any)} accessibilityLabel={s.label} />
            </View>
          ))}
        </AppCard>
      </AppScreen>
    </>
  );
};
