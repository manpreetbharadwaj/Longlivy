import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';

/**
 * Required for longer fasting periods. Never claims medical clearance —
 * only surfaces general, cautious information.
 */
export const SafetyNotice: React.FC = React.memo(() => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: 'rgba(224,162,78,0.14)',
        borderWidth: 1.5,
        borderColor: 'rgba(224,162,78,0.4)',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <View style={{ marginRight: theme.spacing.xs, marginTop: 2 }}>
          <AppIcon name="information-circle" size={20} color="#D6A253" />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSmall" color="#D6A253">
            Before you start a longer fast
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.65)" style={{ marginTop: theme.spacing.xxs }}>
            Prolonged fasting is not suitable for everyone. Individual health factors may be relevant, and
            professional medical advice should be sought if you have any health concerns. Solace does
            not provide medical clearance and cannot confirm you are "fit" for a given fasting duration.
          </AppText>
        </View>
      </View>
    </View>
  );
});

SafetyNotice.displayName = 'SafetyNotice';
