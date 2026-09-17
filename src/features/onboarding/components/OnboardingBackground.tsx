import React from 'react';
import { View, StatusBar, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowOrb } from '@/components/common/GlowOrb';
import { onboardingGradient, onboardingAccent, onboardingNeutral } from '../theme/onboardingTheme';

interface OnboardingBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Softens both glows — used on content-dense steps (ruler pickers, goal cards) so the atmosphere stays in the background. */
  dim?: boolean;
}

/**
 * The shared atmosphere for every onboarding screen — warm near-black
 * gradient with two controlled glows, never more than two light sources at
 * once so it stays "atmospheric lighting", not a busy skybox. Only one of
 * the two is blue (`onboardingAccent`, top-right) — the second is a warm
 * taupe tone, not a second blue — so the backdrop itself doesn't already
 * read as "blue everywhere" before any content is even on screen. Every
 * onboarding screen mounts this once instead of hand-rolling its own
 * LinearGradient + GlowOrb pair.
 */
export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({ children, style, dim }) => (
  <View style={[{ flex: 1, backgroundColor: onboardingGradient[0] }, style]}>
    <StatusBar barStyle="light-content" />
    <LinearGradient colors={onboardingGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    <GlowOrb size={420} color={onboardingAccent} opacity={dim ? 0.12 : 0.2} pulse style={{ top: -140, right: -120 }} />
    <GlowOrb size={320} color={onboardingNeutral} opacity={dim ? 0.07 : 0.12} style={{ bottom: -60, left: -140 }} />
    {children}
  </View>
);
