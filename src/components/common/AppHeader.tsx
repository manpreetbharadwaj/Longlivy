import React from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export const AppHeader: React.FC<AppHeaderProps> = React.memo(({ title, onBack, rightElement }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top + theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} style={{ width: 32 }}>
          <AppIcon name="chevron-back" size={theme.componentSizes.iconMedium} color={theme.colors.primary} />
        </Pressable>
      ) : (
        <View style={{ width: 32 }} />
      )}
      <AppText variant="headingMedium" style={{ flex: 1 }} align="center">
        {title}
      </AppText>
      <View style={{ width: 32, alignItems: 'flex-end' }}>{rightElement}</View>
    </View>
  );
});

AppHeader.displayName = 'AppHeader';
