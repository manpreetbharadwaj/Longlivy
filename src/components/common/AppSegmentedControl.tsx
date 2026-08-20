import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

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
            backgroundColor: active ? (hero ? 'rgba(255,255,255,0.16)' : theme.colors.card) : 'transparent',
            alignItems: 'center',
            ...(active && !hero ? theme.shadows.card : {}),
          }}
        >
          <AppText variant="label" color={hero ? (active ? '#FFFFFF' : 'rgba(255,255,255,0.55)') : active ? theme.colors.primary : theme.colors.textSecondary}>
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
        backgroundColor: hero ? 'rgba(255,255,255,0.08)' : theme.colors.surfaceElevated,
        borderRadius: theme.radius.md,
        padding: 4,
        ...(hero ? { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.14)' } : {}),
      }}
    >
      {segments.map(renderSegment)}
    </View>
  );
});

AppSegmentedControl.displayName = 'AppSegmentedControl';
