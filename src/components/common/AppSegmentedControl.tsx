import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

interface Segment {
  key: string;
  label: string;
}

interface AppSegmentedControlProps {
  segments: Segment[];
  selectedKey: string;
  onChange: (key: string) => void;
  /** 'hero' styles the track/active pill for a dark gradient background (see TabHeroLayout etc.) — default is unchanged. */
  variant?: 'default' | 'hero';
}

export const AppSegmentedControl: React.FC<AppSegmentedControlProps> = React.memo(({ segments, selectedKey, onChange, variant = 'default' }) => {
  const { theme } = useTheme();
  const hero = variant === 'hero';

  const renderSegment = useCallback(
    (segment: Segment) => {
      const active = segment.key === selectedKey;
      return (
        <Pressable
          key={segment.key}
          onPress={() => onChange(segment.key)}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          style={{
            flex: 1,
            paddingVertical: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            backgroundColor: active ? (hero ? dashboardColors.accent : theme.colors.card) : 'transparent',
            alignItems: 'center',
            ...(active && !hero ? theme.shadows.card : {}),
          }}
        >
          <AppText variant="label" color={hero ? (active ? dashboardColors.background : dashboardColors.textMuted) : active ? theme.colors.primary : theme.colors.textSecondary}>
            {segment.label}
          </AppText>
        </Pressable>
      );
    },
    [selectedKey, onChange, theme, hero]
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: hero ? dashboardColors.surfaceElevated : theme.colors.surfaceElevated,
        borderRadius: theme.radius.md,
        padding: 4,
        ...(hero ? { borderWidth: 1, borderColor: dashboardColors.border } : {}),
      }}
    >
      {segments.map(renderSegment)}
    </View>
  );
});

AppSegmentedControl.displayName = 'AppSegmentedControl';
