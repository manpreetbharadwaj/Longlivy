import React from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { ActivityFigure } from './ActivityFigure';

/** Shown instead of a blank list when there's no activity history yet. */
export const ActivityEmptyState: React.FC<{ onStart: () => void }> = React.memo(({ onStart }) => {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingVertical: theme.spacing.lg }}>
      <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.sm }}>
        <GlowOrb size={96} color="#6AA3DE" opacity={0.3} pulse />
        <ActivityFigure type="walking" size={56} />
      </View>
      <AppText variant="headingSmall" color="#FFFFFF" align="center">
        No activities yet
      </AppText>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs, marginBottom: theme.spacing.md }}>
        Start your first activity to see it here.
      </AppText>
      <Pressable
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Start activity"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.spacing.md,
          height: 40,
          borderRadius: theme.radius.pill,
          borderWidth: 1.5,
          borderColor: 'rgba(106,163,222,0.5)',
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AppIcon name="add-circle-outline" size={16} color="#6AA3DE" />
        <AppText variant="label" color="#6AA3DE" style={{ marginLeft: 6 }}>
          Start activity
        </AppText>
      </Pressable>
    </View>
  );
});
ActivityEmptyState.displayName = 'ActivityEmptyState';
