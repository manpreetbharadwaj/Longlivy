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
}

export const AppSegmentedControl: React.FC<AppSegmentedControlProps> = React.memo(({ segments, selectedKey, onChange }) => {
  const { theme } = useTheme();

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
            backgroundColor: active ? theme.colors.card : 'transparent',
            alignItems: 'center',
            ...(active ? theme.shadows.card : {}),
          }}
        >
          <AppText variant="label" color={active ? theme.colors.primary : theme.colors.textSecondary}>
            {segment.label}
          </AppText>
        </Pressable>
      );
    },
    [selectedKey, onChange, theme]
  );

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius.md,
        padding: 4,
      }}
    >
      {segments.map(renderSegment)}
    </View>
  );
});

AppSegmentedControl.displayName = 'AppSegmentedControl';
