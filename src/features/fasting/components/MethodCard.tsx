import React from 'react';
import { View } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { FastingMethodDefinition } from '../models';

interface MethodCardProps {
  method: FastingMethodDefinition;
  onPress: () => void;
}

export const MethodCard: React.FC<MethodCardProps> = React.memo(({ method, onPress }) => {
  const { theme } = useTheme();
  const categoryTone = method.category === 'longer' ? 'warning' : method.category === 'individual' ? 'info' : 'primary';

  return (
    <AppCard onPress={onPress} style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <AppText variant="headingSmall">{method.name}</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: 2 }}>
            {method.shortExplanation}
          </AppText>
        </View>
        <AppBadge label={method.category} tone={categoryTone as any} />
      </View>
      {method.recommendation ? (
        <AppText variant="caption" color={theme.colors.primary} style={{ marginTop: theme.spacing.xxs }}>
          {method.recommendation}
        </AppText>
      ) : null}
    </AppCard>
  );
});

MethodCard.displayName = 'MethodCard';
