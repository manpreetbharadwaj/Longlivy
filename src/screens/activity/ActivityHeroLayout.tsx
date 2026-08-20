import React from 'react';
import { View, ScrollView, Pressable, StatusBar, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { activityHeroGradient } from '@/theme/gradients';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';

interface ActivityHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The "different atmosphere" for a live activity session — same hero
 * technique as fasting/onboarding (dark gradient, GlowOrb, glass cards) but
 * its own deep-navy-to-blue gradient (activityHeroGradient) so tracking a
 * workout reads as its own kinetic mode rather than a re-skin of fasting's
 * cooler "lab" atmosphere. Used by ActiveActivityScreen and
 * ActivitySummaryScreen so the whole "track a workout" moment — start to
 * finish — shares one consistent feel.
 */
export const ActivityHeroLayout: React.FC<ActivityHeroLayoutProps> = ({ children, title, onBack, scroll = true, contentContainerStyle }) => {
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
    <View style={{ flex: 1, backgroundColor: activityHeroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={activityHeroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={340} color="#6AA3DE" opacity={0.22} style={{ top: -100, right: -90 }} />
      <GlowOrb size={240} color="#1F4E7A" opacity={0.2} style={{ bottom: 40, left: -100 }} />
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
