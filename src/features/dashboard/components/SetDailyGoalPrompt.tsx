import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { dashboardColors } from '../dashboardTheme';

/**
 * Shown in place of calorie numbers when the account has no daily goal yet
 * (see selectHasCalorieGoal). The server only calculates targets once the
 * profile has birth date, gender, height and weight, so the action opens
 * Edit profile.
 */
export const SetDailyGoalPrompt: React.FC<{ align?: 'left' | 'center' }> = React.memo(({ align = 'left' }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  // Navigates across tabs: Home/Nutrition stacks -> Profile stack.
  const navigation = useNavigation<{ navigate: (tab: 'ProfileTab', params: { screen: 'EditProfile' }) => void }>();
  const open = useCallback(() => navigation.navigate('ProfileTab', { screen: 'EditProfile' }), [navigation]);

  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', marginBottom: theme.spacing.md }}>
      <AppText variant="headingMedium" color={dashboardColors.textPrimary} align={align}>
        {t('home.goal.setTitle')}
      </AppText>
      <AppText variant="bodySmall" color={dashboardColors.textSecondary} align={align} style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
        {t('home.goal.setBody')}
      </AppText>
      <AppGradientButton label={t('home.goal.setAction')} onPress={open} fullWidth={false} />
    </View>
  );
});
SetDailyGoalPrompt.displayName = 'SetDailyGoalPrompt';
