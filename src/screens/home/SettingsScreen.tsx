import React from 'react';
import { View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useAppPreferences, AppLanguage } from '@/contexts/AppPreferencesContext';
import { useTranslation } from '@/localization';
import { VoiceCoachingSettings } from '@/features/activity/components/VoiceCoachingSettings';
import { HealthConnectSettings } from '@/features/healthConnect/components/HealthConnectSettings';

export const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { preferences, setUnitSystem, setLanguage, setLiveMomentsEnabled, setHapticsEnabled } = useAppPreferences();

  return (
    <TabHeroLayout title={t('settings.title')} onBack={() => navigation.goBack()}>
      <SectionLabel>{t('settings.units.title')}</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppSegmentedControl
          variant="hero"
          segments={[
            { key: 'metric', label: t('settings.units.metric') },
            { key: 'imperial', label: t('settings.units.imperial') },
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

      <SectionLabel>{t('settings.liveMoments.title')}</SectionLabel>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <ToggleRow label={t('settings.liveMoments.showCards')} value={preferences.liveMomentsEnabled} onChange={setLiveMomentsEnabled} />
        <ToggleRow label={t('settings.liveMoments.haptics')} value={preferences.hapticsEnabled} onChange={setHapticsEnabled} last />
      </HeroCard>

      <SectionLabel>Voice coaching</SectionLabel>
      <VoiceCoachingSettings />

      {Platform.OS === 'android' ? (
        <>
          <SectionLabel>Health Connect</SectionLabel>
          <HealthConnectSettings />
        </>
      ) : null}

      <SectionLabel>{t('settings.data.title')}</SectionLabel>
      <HeroCard onPress={() => navigation.navigate('Privacy')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          {t('settings.data.privacy')}
        </AppText>
      </HeroCard>
      <HeroCard onPress={() => navigation.navigate('DataManagement')} style={{ marginBottom: theme.spacing.md, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          {t('settings.data.dataManagement')}
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
