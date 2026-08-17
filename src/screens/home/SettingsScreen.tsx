import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { ThemePreference } from '@/contexts/ThemeContext';
import { useAppPreferences } from '@/contexts/AppPreferencesContext';

export const SettingsScreen: React.FC = () => {
  const { theme, preference, setPreference } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { preferences, setUnitSystem, setLiveMomentsEnabled, setHapticsEnabled } = useAppPreferences();

  return (
    <>
      <AppHeader title="Settings" onBack={() => navigation.goBack()} />
      <AppScreen>
        <SectionLabel>Appearance</SectionLabel>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl
            segments={[
              { key: 'light', label: 'Light' },
              { key: 'dark', label: 'Dark' },
              { key: 'system', label: 'System' },
            ]}
            selectedKey={preference}
            onChange={(k) => setPreference(k as ThemePreference)}
          />
        </AppCard>

        <SectionLabel>Units</SectionLabel>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl
            segments={[
              { key: 'metric', label: 'Metric' },
              { key: 'imperial', label: 'Imperial' },
            ]}
            selectedKey={preferences.unitSystem}
            onChange={(k) => setUnitSystem(k as 'metric' | 'imperial')}
          />
        </AppCard>

        <SectionLabel>Fasting timeline "live moments"</SectionLabel>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <ToggleRow label="Show live moment cards" value={preferences.liveMomentsEnabled} onChange={setLiveMomentsEnabled} />
          <ToggleRow label="Haptic feedback" value={preferences.hapticsEnabled} onChange={setHapticsEnabled} last />
        </AppCard>

        <SectionLabel>Data</SectionLabel>
        <AppButton label="Health integrations" onPress={() => navigation.navigate('HealthIntegrations')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Privacy & data" onPress={() => navigation.navigate('Privacy')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Data management" onPress={() => navigation.navigate('DataManagement')} variant="outline" />
      </AppScreen>
    </>
  );
};

const SectionLabel: React.FC<{ children: string }> = ({ children }) => {
  const { theme } = useTheme();
  return (
    <AppText variant="label" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xs, marginTop: theme.spacing.xs }}>
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
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium">{label}</AppText>
      <AppSwitch value={value} onValueChange={onChange} accessibilityLabel={label} />
    </View>
  );
};
