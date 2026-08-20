import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';

const PROTECTED_DATA = ['Weight', 'Nutritional data', 'Fasting periods', 'Activity data', 'Health data', 'Sleep data', 'Heart rate', 'Body fat', 'GPS routes'];

export const PrivacyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <TabHeroLayout title="Privacy" onBack={() => navigation.goBack()}>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
          What we protect
        </AppText>
        {PROTECTED_DATA.map((item) => (
          <AppText key={item} variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: 2 }}>
            • {item}
          </AppText>
        ))}
        <AppText variant="caption" color="rgba(255,255,255,0.45)" style={{ marginTop: theme.spacing.xs }}>
          GPS routes receive additional protection given their sensitivity.
        </AppText>
      </HeroCard>

      <HeroCard onPress={() => undefined} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Export my data
        </AppText>
      </HeroCard>
      <HeroCard onPress={() => undefined} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Manage consent
        </AppText>
      </HeroCard>
      <AppGradientButton label="Delete my account" onPress={() => undefined} colors={['#E7896A', '#C4463A']} />

      <View style={{ marginTop: theme.spacing.lg }}>
        <AppText variant="caption" color="rgba(255,255,255,0.45)">
          This is a prototype UI. No real export, consent, or deletion backend is wired up yet — actions
          here are placeholders for the eventual GDPR-compliant flows.
        </AppText>
      </View>
    </TabHeroLayout>
  );
};
