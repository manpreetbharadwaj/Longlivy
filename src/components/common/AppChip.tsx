import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppIcon, AppIconName } from './AppIcon';

interface AppChipProps {
  label: string;
  icon?: AppIconName;
  selected?: boolean;
  onPress?: () => void;
}

export const AppChip: React.FC<AppChipProps> = React.memo(({ label, icon, selected, onPress }) => {
  const { theme } = useTheme();
  const color = selected ? theme.colors.onPrimary : theme.colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xxs + 2,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? theme.colors.primary : theme.colors.surfaceElevated,
        borderWidth: 1,
        borderColor: selected ? theme.colors.primary : theme.colors.border,
        marginRight: theme.spacing.xs,
      }}
    >
      {icon ? (
        <View style={{ marginRight: 5 }}>
          <AppIcon name={icon} size={14} color={color} />
        </View>
      ) : null}
      <AppText variant="label" color={color}>
        {label}
      </AppText>
    </Pressable>
  );
});

AppChip.displayName = 'AppChip';
