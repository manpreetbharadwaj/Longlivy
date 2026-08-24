import React from 'react';
import { View, StatusBar, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowOrb } from '@/components/common/GlowOrb';
import { onboardingGradient, onboardingAccent, onboardingData } from '../theme/onboardingTheme';

interface OnboardingBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Softens both glows — used on content-dense steps (ruler pickers, goal cards) so the atmosphere stays in the background. */
  dim?: boolean;
}

/**
 * The shared atmosphere for every onboarding screen — near-black to
 * navy-violet gradient with two controlled glows (indigo + cyan), never
 * more than two light sources at once so it stays "atmospheric lighting",
 * not a busy skybox. Every onboarding screen mounts this once instead of
 * hand-rolling its own LinearGradient + GlowOrb pair.
 */
export const OnboardingBackground: React.FC<OnboardingBackgroundProps> = ({ children, style, dim }) => (
  <View style={[{ flex: 1, backgroundColor: onboardingGradient[0] }, style]}>
    <StatusBar barStyle="light-content" />
    <LinearGradient colors={onboardingGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
    <GlowOrb size={420} color={onboardingAccent} opacity={dim ? 0.16 : 0.3} pulse style={{ top: -140, right: -120 }} />
    <GlowOrb size={320} color={onboardingData} opacity={dim ? 0.08 : 0.14} style={{ bottom: -60, left: -140 }} />
    {children}
  </View>
);
