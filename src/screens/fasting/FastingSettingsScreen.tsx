import React, { useCallback } from 'react';
import { Alert, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectNotificationSettings } from '@/features/notifications/selectors';
import { DELIVERABLE_NOTIFICATION_TYPES, toggleNotificationSettingThunk } from '@/features/notifications/notificationSlice';
import { notificationTypeLabel, notificationTypeDescription } from '@/features/notifications/models';

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
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectNotificationSettings).filter((s) => FASTING_EVENT_TYPES.includes(s.type as any));

  const toggle = useCallback(
    (type: (typeof FASTING_EVENT_TYPES)[number]) =>
      dispatch(toggleNotificationSettingThunk(type))
        .unwrap()
        .catch((e: unknown) => Alert.alert(t('fasting.settings.saveFailedTitle'), e instanceof Error ? e.message : t('fasting.settings.saveFailedBody'))),
    [dispatch, t],
  );

  return (
    <>
      <AppHeader title={t('fasting.menu.settings')} onBack={() => navigation.goBack()} />
      <AppScreen belowHeader>
        <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
          {t('fasting.settings.notifications')}
        </AppText>
        {/* None of these is delivered yet (no push provider / backend events); say so instead of offering live switches. */}
        {settings.some((s) => !DELIVERABLE_NOTIFICATION_TYPES.has(s.type)) ? (
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.sm }}>
            {t('fasting.settings.notDeliverableNotice')}
          </AppText>
        ) : null}
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
                <AppText variant="bodyMedium">{notificationTypeLabel(s, t)}</AppText>
                <AppText variant="caption" color={theme.colors.textSecondary}>
                  {notificationTypeDescription(s, t)}
                </AppText>
              </View>
              <AppSwitch
                value={s.enabled}
                onValueChange={() => toggle(s.type as any)}
                disabled={!DELIVERABLE_NOTIFICATION_TYPES.has(s.type)}
                accessibilityLabel={notificationTypeLabel(s, t)}
              />
            </View>
          ))}
        </AppCard>
      </AppScreen>
    </>
  );
};
