import React from 'react';
import { View, Pressable } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';

export const MILESTONE_THRESHOLDS = [0.25, 0.5, 0.75, 1] as const;

const MILESTONE_COPY: Record<number, string> = {
  0.25: 'In this phase, the use of different energy sources typically starts to shift. The extent to which this is pronounced varies from person to person.',
  0.5: "You're halfway through your planned fasting window. Individual experience during fasting varies widely and depends on many factors.",
  0.75: 'Later phases of a fast are sometimes associated with further metabolic changes — the exact timing and extent vary between people and are not precisely measurable from time alone.',
  1: "You've reached your planned fasting duration. How you feel from here is individual — there's no single 'correct' way a fast should feel.",
};

interface LiveMomentCardProps {
  milestone: number;
  onDismiss: () => void;
}

/**
 * Optional, dismissible milestone notice shown during an active fast.
 * Deliberately soft language throughout — never a medical claim, never an
 * exact biological timepoint (see acceptance criteria: "Live moments... do
 * not contain any medical promises").
 */
export const LiveMomentCard: React.FC<LiveMomentCardProps> = React.memo(({ milestone, onDismiss }) => {
  const { theme } = useTheme();

  return (
    <AppCard style={{ marginBottom: theme.spacing.md, backgroundColor: theme.colors.primaryMuted, borderColor: theme.colors.primary + '33' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <AppIcon name="sparkles-outline" size={18} color={theme.colors.primary} />
        <View style={{ flex: 1, marginLeft: theme.spacing.xs }}>
          <AppText variant="headingSmall" color={theme.colors.primary}>
            {milestone >= 1 ? 'Fasting goal reached' : 'Your fasting reaches a new milestone'}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: 2 }}>
            {MILESTONE_COPY[milestone]}
          </AppText>
        </View>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
          <AppIcon name="close" size={18} color={theme.colors.textTertiary} />
        </Pressable>
      </View>
    </AppCard>
  );
});

LiveMomentCard.displayName = 'LiveMomentCard';
