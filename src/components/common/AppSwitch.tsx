import React from 'react';
import { Switch } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
}

export const AppSwitch: React.FC<AppSwitchProps> = React.memo(({ value, onValueChange, accessibilityLabel }) => {
  const { theme } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      accessibilityLabel={accessibilityLabel}
      trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
      thumbColor={theme.colors.surface}
    />
  );
});

AppSwitch.displayName = 'AppSwitch';
