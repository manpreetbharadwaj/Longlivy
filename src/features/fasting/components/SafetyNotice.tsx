import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/config/branding';

/**
 * Required for longer fasting periods. Never claims medical clearance —
 * only surfaces general, cautious information.
 */
export const SafetyNotice: React.FC = React.memo(() => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: `${theme.colors.warning}1F`,
        borderWidth: 1,
        borderColor: `${theme.colors.warning}55`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginRight: theme.spacing.xs, marginTop: 2 }}>
          <AppIcon name="information-circle" size={20} color={theme.colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSmall" color={theme.colors.warning}>
            Before you start a longer fast
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.xxs }}>
            Prolonged fasting is not suitable for everyone. Individual health factors may be relevant, and
            professional medical advice should be sought if you have any health concerns. {brand.name} does
            not provide medical clearance and cannot confirm you are "fit" for a given fasting duration.
          </AppText>
        </View>
      </View>
    </View>
  );
});

SafetyNotice.displayName = 'SafetyNotice';
