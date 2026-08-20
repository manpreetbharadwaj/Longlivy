import React from 'react';
import { View, ScrollView, Pressable, StatusBar, ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { meditationHeroGradient } from '@/theme/gradients';

interface MeditationHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The "different atmosphere" for a live meditation session — same hero
 * technique as fasting/activity (dark gradient, GlowOrb, glass cards) but
 * its own deep-violet gradient (meditationHeroGradient) with pulsing,
 * slow-breathing glow orbs instead of the static ones used elsewhere — the
 * design brief's "calm" mode should feel different in motion, not just
 * color. Used by MeditationPlayerScreen and BreathingExerciseScreen so the
 * whole "sit with a session" moment shares one atmosphere.
 */
export const MeditationHeroLayout: React.FC<MeditationHeroLayoutProps> = ({ children, title, onBack, scroll = true, contentContainerStyle }) => {
  const { theme } = useTheme();

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
    <View style={{ flex: 1, backgroundColor: meditationHeroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={meditationHeroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={380} color="#9B7FD9" opacity={0.26} pulse style={{ top: -110, left: -110 }} />
      <GlowOrb size={280} color="#B98CE0" opacity={0.18} pulse style={{ bottom: 20, right: -90 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        {scroll ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl }, contentContainerStyle]}>
            {(onBack || title) ? header : null}
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: theme.spacing.md }}>
            {(onBack || title) ? header : null}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
