import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { ThemePreference } from '@/contexts/ThemeContext';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { useTranslation } from '@/localization';

export const SettingsScreen: React.FC = () => {
  const { theme, preference, setPreference } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { preferences, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled } = useAppPreferences();

  return (
    <TabHeroLayout title="Settings" onBack={() => navigation.goBack()}>
      <SectionLabel>Appearance</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppSegmentedControl
          variant="hero"
          segments={[
            { key: 'light', label: 'Light' },
            { key: 'dark', label: 'Dark' },
            { key: 'system', label: 'System' },
          ]}
          selectedKey={preference}
          onChange={(k) => setPreference(k as ThemePreference)}
        />
      </HeroCard>

      <SectionLabel>Units</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppSegmentedControl
          variant="hero"
          segments={[
            { key: 'metric', label: 'Metric' },
            { key: 'imperial', label: 'Imperial' },
          ]}
          selectedKey={preferences.unitSystem}
          onChange={(k) => setUnitSystem(k as 'metric' | 'imperial')}
        />
      </HeroCard>

      <SectionLabel>{t('settings.language.title')}</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppSegmentedControl
          variant="hero"
          segments={[
            { key: 'en', label: t('settings.language.english') },
            { key: 'de', label: t('settings.language.german') },
          ]}
          selectedKey={preferences.language}
          onChange={(k) => setLanguage(k as AppLanguage)}
        />
      </HeroCard>

      <SectionLabel>Fasting timeline "live moments"</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <ToggleRow label="Show live moment cards" value={preferences.liveMomentsEnabled} onChange={setLiveMomentsEnabled} />
        <ToggleRow label="Haptic feedback" value={preferences.hapticsEnabled} onChange={setHapticsEnabled} last />
      </HeroCard>

      <SectionLabel>Data</SectionLabel>
      <HeroCard onPress={() => navigation.navigate('HealthIntegrations')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Health integrations
        </AppText>
      </HeroCard>
      <HeroCard onPress={() => navigation.navigate('Privacy')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Privacy & data
        </AppText>
      </HeroCard>
      <HeroCard onPress={() => navigation.navigate('DataManagement')} style={{ marginBottom: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          Data management
        </AppText>
      </HeroCard>

      <SectionLabel>{t('settings.support.title')}</SectionLabel>
      <HeroCard onPress={() => navigation.navigate('Feedback')} style={{ paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          {t('settings.support.feedback')}
        </AppText>
      </HeroCard>
    </TabHeroLayout>
  );
};

const SectionLabel: React.FC<{ children: string }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <AppText variant="label" color="rgba(255,255,255,0.55)" style={{ marginBottom: theme.spacing.xs, marginTop: theme.spacing.xs }}>
      {children.toUpperCase()}
    </AppText>
  );
};

const ToggleRow: React.FC<{ label: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }> = ({ label, value, onChange, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <AppText variant="bodyMedium" color="#FFFFFF">
        {label}
      </AppText>
      <AppSwitch variant="hero" value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
};
