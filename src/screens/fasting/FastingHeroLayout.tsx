import React from 'react';
import { View, ScrollView, Pressable, StatusBar, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { fastingHeroGradient } from '@/theme/gradients';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';

interface FastingHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The "different atmosphere" for fasting the design brief asked for — same
 * hero technique as onboarding/auth (dark gradient, GlowOrb, glass cards)
 * but its own cooler, more cyan-forward gradient (fastingHeroGradient) so
 * it reads as a distinct mode, not a copy of onboarding. Used by both
 * ActiveFastScreen and FastingStartedScreen so the whole "start a fast"
 * moment shares one consistent atmosphere.
 */
export const FastingHeroLayout: React.FC<FastingHeroLayoutProps> = ({ children, title, onBack, scroll = true, contentContainerStyle }) => {
  const { theme } = useTheme();
  const tabBarSpacing = useFloatingTabBarSpacing();

  const header = (
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
      <View style={{ width: 32 }} />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: fastingHeroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={fastingHeroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={360} color="#0E7A9E" opacity={0.24} style={{ top: -120, right: -100 }} />
      <GlowOrb size={260} color="#5B9BD5" opacity={0.16} style={{ bottom: 60, left: -100 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl + tabBarSpacing }, contentContainerStyle]}>
            {(onBack || title) ? header : null}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: theme.spacing.md, paddingBottom: theme.spacing.md + tabBarSpacing }}>
            {(onBack || title) ? header : null}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
