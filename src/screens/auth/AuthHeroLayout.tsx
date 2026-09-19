import React from 'react';
import { View, ScrollView, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { heroGradient } from '@/theme/gradients';

interface AuthHeroLayoutProps {
  children: React.ReactNode;
  onBack?: () => void;
}

/**
 * The auth-screen equivalent of OnboardingStepLayout's hero variant — same
 * dark gradient/glow atmosphere as Welcome and the onboarding flow, but
 * without a step progress bar since Login/Register/Forgot-password aren't
 * numbered steps. Kept as its own small layout (not a reuse of
 * OnboardingStepLayout) since a progress bar genuinely doesn't apply here.
 */
export const AuthHeroLayout: React.FC<AuthHeroLayoutProps> = ({ children, onBack }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: heroGradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={heroGradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <GlowOrb size={340} color="#3D5266" opacity={0.28} pulse style={{ top: -110, right: -90 }} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl, flexGrow: 1 }}>
          {onBack ? (
            <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel={t('common.back')} hitSlop={12} style={{ width: 32, height: 32, justifyContent: 'center', marginBottom: theme.spacing.sm }}>
              <AppIcon name="chevron-back" size={24} color="#FFFFFF" />
            </Pressable>
          ) : null}
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
