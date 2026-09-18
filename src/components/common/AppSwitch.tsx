import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
  /** 'hero' uses fixed light-on-dark colors instead of theme tokens — theme.colors.primary is a dark teal in light mode and nearly disappears against the dark hero gradient. */
  variant?: 'default' | 'hero';
  disabled?: boolean;
}

export const AppSwitch: React.FC<AppSwitchProps> = React.memo(({ value, onValueChange, accessibilityLabel, variant = 'default', disabled = false }) => {
  const { theme } = useTheme();
  const hero = variant === 'hero';
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      trackColor={hero ? { false: 'rgba(255,255,255,0.18)', true: '#1F6F5C' } : { false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={hero ? '#FFFFFF' : theme.colors.surface}
    />
  );
});

AppSwitch.displayName = 'AppSwitch';
