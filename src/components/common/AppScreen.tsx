import React from 'react';
import { ScrollView, View, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Set when an `AppHeader` sits above this screen: the header already pads for the top safe area, so this skips it. */
  belowHeader?: boolean;
}

export const AppScreen: React.FC<AppScreenProps> = React.memo(
  ({ children, scroll = true, padded = true, style, refreshing, onRefresh, belowHeader = false }) => {
    const { theme } = useTheme();
    // Same reasoning as SectionHeroLayout: the floating tab bar is an
    // absolutely-positioned overlay, not a docked bar that reserves layout
    // space, so the content area stops above it.
    const tabBarSpacing = useFloatingTabBarSpacing();
    const content = { padding: padded ? theme.spacing.md : 0, paddingBottom: theme.spacing.xl };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={belowHeader ? ['left', 'right'] : ['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            style={{ flex: 1, marginBottom: tabBarSpacing }}
            contentContainerStyle={[content, style]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1, marginBottom: tabBarSpacing }, content, style]}>{children}</View>
        )}
      </SafeAreaView>
    );
  }
);

AppScreen.displayName = 'AppScreen';
