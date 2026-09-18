import React from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { FastingMethodDefinition } from '../models';

interface MethodCardProps {
  method: FastingMethodDefinition;
  onPress: () => void;
  selected?: boolean;
}

export const MethodCard: React.FC<MethodCardProps> = React.memo(({ method, onPress, selected }) => {
  const { theme } = useTheme();
  // AppBadge's "primary" tone reads theme.colors.primary, which in light
  // mode (the app's actual current system-following mode, even though this
  // screen's own surface is hardcoded dark) is a very dark teal close to
  // the hero gradient's own background — effectively invisible on this
  // card. "success" resolves to a genuinely bright green in both modes, so
  // it's used here purely for contrast, not because "intermittent" is
  // semantically a success state.
  const categoryTone = method.category === 'longer' ? 'warning' : method.category === 'individual' ? 'info' : 'success';

  return (
    <HeroCard
      onPress={onPress}
      scaleOnPress
      style={{
        marginBottom: theme.spacing.sm,
        borderColor: selected ? '#4FAE8F' : 'rgba(255,255,255,0.14)',
        borderWidth: selected ? 2 : 1.5,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF">
            {method.name}
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }}>
            {method.shortExplanation}
          </AppText>
        </View>
        <AppBadge label={method.category} tone={categoryTone as any} />
      </View>
      {method.recommendation ? (
        <AppText variant="caption" color="#4FAE8F" style={{ marginTop: theme.spacing.xxs }}>
          {method.recommendation}
        </AppText>
      ) : null}
    </HeroCard>
  );
});

MethodCard.displayName = 'MethodCard';
