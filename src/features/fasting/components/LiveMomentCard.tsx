import React from 'react';
import { View, Pressable } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';

export const MILESTONE_THRESHOLDS = [0.1, 0.25, 0.5, 0.75, 0.9, 1] as const;

const MILESTONE_COPY: Record<number, string> = {
  0.1: "You're underway. The first stretch of a fast is often the easiest to notice — it gets easier from here for most people.",
  0.25: 'In this phase, the use of different energy sources typically starts to shift. The extent to which this is pronounced varies from person to person.',
  0.5: "You're halfway through your planned fasting window. Individual experience during fasting varies widely and depends on many factors.",
  0.75: 'Later phases of a fast are sometimes associated with further metabolic changes — the exact timing and extent vary between people and are not precisely measurable from time alone.',
  0.9: "Almost there. However you're feeling right now is normal — there's no single 'correct' way a fast should feel.",
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
    <View
      style={{
        backgroundColor: 'rgba(31,163,145,0.16)',
        borderWidth: 1.5,
        borderColor: 'rgba(31,163,145,0.4)',
        borderRadius: theme.radius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <AppIcon name="sparkles-outline" size={18} color="#4FAE8F" />
        <View style={{ flex: 1, marginLeft: theme.spacing.xs }}>
          <AppText variant="headingSmall" color="#4FAE8F">
            {milestone >= 1 ? 'Fasting goal reached' : 'Your fasting reaches a new milestone'}
          </AppText>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.7)" style={{ marginTop: 2 }}>
            {MILESTONE_COPY[milestone]}
          </AppText>
        </View>
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={8}>
          <AppIcon name="close" size={18} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>
    </View>
  );
});

LiveMomentCard.displayName = 'LiveMomentCard';
