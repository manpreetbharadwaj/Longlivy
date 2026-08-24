import React from 'react';
import { View, ScrollView, Pressable, StatusBar, RefreshControl, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { GlowOrb } from './GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { heroGradient } from '@/theme/gradients';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';

interface TabHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The shared dark-hero shell for main tab/profile screens — same
 * heroGradient/GlowOrb/glass technique as onboarding and auth, applied to
 * the app's everyday surfaces per the request to carry the theme through
 * every tab and the profile stack. Distinct from FastingHeroLayout (its
 * own cooler gradient, deliberately) and AuthHeroLayout (no back-button
 * special casing needed there) — this one is the general-purpose version.
 */
export const TabHeroLayout: React.FC<TabHeroLayoutProps> = ({
  children,
  title,
  onBack,
  rightElement,
  scroll = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
}) => {
  const { theme } = useTheme();
  // The floating tab bar is an absolutely-positioned overlay, not a docked
  // bar that reserves its own layout space — so every screen under it has
  // to add this manually, or its last item can end up underneath the pill.
  const tabBarSpacing = useFloatingTabBarSpacing();

  const header =
    onBack || title || rightElement ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} style={{ width: 32 }}>
            <AppIcon name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
        {title ? (
          <AppText variant="headingMedium" color="#FFFFFF" align="center" style={{ flex: 1 }}>
            {title}
          </AppText>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={{ width: 32, alignItems: 'flex-end' }}>{rightElement}</View>
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={heroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={340} color="#0E7A9E" opacity={0.22} style={{ top: -110, right: -90 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl + tabBarSpacing }, contentContainerStyle]}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" /> : undefined}
          >
            {header}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: theme.spacing.md, paddingBottom: theme.spacing.md + tabBarSpacing }}>
            {header}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
