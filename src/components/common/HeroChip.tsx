import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface HeroChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Pill selector for the dark hero screens — the AppChip equivalent for compact multi-option rows (e.g. gender). */
export const HeroChip: React.FC<HeroChipProps> = React.memo(({ label, selected, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs + 2,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? '#1FA391' : 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: selected ? '#1FA391' : 'rgba(255,255,255,0.16)',
        marginRight: theme.spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <AppText variant="label" color="#FFFFFF">
        {label}
      </AppText>
    </Pressable>
  );
});

HeroChip.displayName = 'HeroChip';
