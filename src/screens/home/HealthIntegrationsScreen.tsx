import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectHealthConnections } from '@/features/health/selectors';
import { connectHealthPlatformThunk, disconnectHealthPlatformThunk } from '@/features/health/healthIntegrationSlice';
import { HealthPlatformId } from '@/features/health/models';
import { ProfileStackParamList } from '@/navigation/types';

export const HealthIntegrationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const connections = useAppSelector(selectHealthConnections);

  const toggle = useCallback(
    (platform: HealthPlatformId, connected: boolean) => {
      dispatch(connected ? disconnectHealthPlatformThunk(platform) : connectHealthPlatformThunk(platform));
    },
    [dispatch]
  );

  return (
    <TabHeroLayout title="Health integrations" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        Each platform is connected through its own adapter and normalized into Solace's internal data
        model — no single provider is hard-wired into the app.
      </AppText>
      {connections.map((c) => (
        <HeroCard key={c.platform} style={{ marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <AppText variant="headingSmall" color="#FFFFFF">
                {c.displayName}
              </AppText>
              {c.connected ? (
                <AppBadge label={`Synced · ${c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleTimeString() : ''}`} tone="success" />
              ) : (
                <AppText variant="caption" color="rgba(255,255,255,0.45)">
                  Not connected
                </AppText>
              )}
            </View>
            <ToggleButton connected={c.connected} onPress={() => toggle(c.platform, c.connected)} />
          </View>
        </HeroCard>
      ))}
    </TabHeroLayout>
  );
};

const ToggleButton: React.FC<{ connected: boolean; onPress: () => void }> = ({ connected, onPress }) => {
  const { theme } = useTheme();
  return (
    <HeroCard
      onPress={onPress}
      style={{
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: connected ? 'rgba(255,255,255,0.08)' : 'rgba(79,174,143,0.22)',
        borderColor: connected ? 'rgba(255,255,255,0.14)' : 'rgba(79,174,143,0.5)',
      }}
    >
      <AppText variant="label" color={connected ? '#FFFFFF' : '#4FAE8F'}>
        {connected ? 'Disconnect' : 'Connect'}
      </AppText>
    </HeroCard>
  );
};
