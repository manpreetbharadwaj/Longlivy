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
}

export const AppScreen: React.FC<AppScreenProps> = React.memo(
  ({ children, scroll = true, padded = true, style, refreshing, onRefresh }) => {
    const { theme } = useTheme();
    // Same reasoning as SectionHeroLayout: the floating tab bar is an
    // absolutely-positioned overlay, not a docked bar that reserves layout
    // space, so screens under it must add this manually or their last item
    // ends up hidden behind the opaque pill.
    const tabBarSpacing = useFloatingTabBarSpacing();
    const content = { padding: padded ? theme.spacing.md : 0, paddingBottom: theme.spacing.xxxl + tabBarSpacing };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[content, style]}
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
          <View style={[{ flex: 1 }, content, style]}>{children}</View>
        )}
      </SafeAreaView>
    );
  }
);

AppScreen.displayName = 'AppScreen';
