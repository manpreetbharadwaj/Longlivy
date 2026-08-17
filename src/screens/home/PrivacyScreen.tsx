import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';

const PROTECTED_DATA = ['Weight', 'Nutritional data', 'Fasting periods', 'Activity data', 'Health data', 'Sleep data', 'Heart rate', 'Body fat', 'GPS routes'];

export const PrivacyScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  return (
    <>
      <AppHeader title="Privacy" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
            What we protect
          </AppText>
          {PROTECTED_DATA.map((item) => (
            <AppText key={item} variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: 2 }}>
              • {item}
            </AppText>
          ))}
          <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.xs }}>
            GPS routes receive additional protection given their sensitivity.
          </AppText>
        </AppCard>

        <AppButton label="Export my data" onPress={() => undefined} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Manage consent" onPress={() => undefined} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Delete my account" onPress={() => undefined} variant="danger" />

        <View style={{ marginTop: theme.spacing.lg }}>
          <AppText variant="caption" color={theme.colors.textTertiary}>
            This is a prototype UI. No real export, consent, or deletion backend is wired up yet — actions
            here are placeholders for the eventual GDPR-compliant flows.
          </AppText>
        </View>
      </AppScreen>
    </>
  );
};
