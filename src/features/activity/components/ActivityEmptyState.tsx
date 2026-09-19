import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { ActivityFigure } from './ActivityFigure';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

/** Shown instead of a blank list when there's no activity history yet. */
export const ActivityEmptyState: React.FC<{ onStart: () => void }> = React.memo(({ onStart }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
      <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
        <GlowOrb size={96} color="#D98657" opacity={0.18} pulse />
        <ActivityFigure type="walking" size={56} />
      </View>
      <AppText variant="headingSmall" color={dashboardColors.textPrimary} align="center">
        {t('activity.emptyTitle')}
      </AppText>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
        {t('activity.emptyMessage')}
      </AppText>
      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel={t('activity.startActivity')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          height: 40,
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          borderColor: dashboardColors.accent,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AppIcon name="add-circle-outline" size={16} color={dashboardColors.accent} />
        <AppText variant="label" color={dashboardColors.accent} style={{ marginLeft: 6 }}>
          {t('activity.startActivity')}
        </AppText>
      </Pressable>
    </View>
  );
});
ActivityEmptyState.displayName = 'ActivityEmptyState';
