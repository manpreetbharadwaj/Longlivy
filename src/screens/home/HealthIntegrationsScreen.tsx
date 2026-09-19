import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectHealthConnections } from '@/features/health/selectors';
import { connectHealthPlatformThunk, disconnectHealthPlatformThunk } from '@/features/health/healthIntegrationSlice';
import { HealthPlatformId } from '@/features/health/models';
import { selectNoiseConnectionState, selectConnectedNoiseDeviceName } from '@/features/noise/selectors';
import { NOISE_STATE_COPY } from '@/features/noise/models';
import { ProfileStackParamList } from '@/navigation/types';

// Noise Smartwatch BLE integration is hidden for now — same "pause, don't
// delete" approach as the Health Connect/Apple Health work: the feature
// code, slice, and NoiseDevice screen are untouched and still reachable by
// direct navigation, just not surfaced as an entry point on this screen.
const SHOW_NOISE_SMARTWATCH = false;

export const HealthIntegrationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const dispatch = useAppDispatch();
  const connections = useAppSelector(selectHealthConnections);
  const noiseConnectionState = useAppSelector(selectNoiseConnectionState);
  const noiseDeviceName = useAppSelector(selectConnectedNoiseDeviceName);

  const toggle = useCallback(
    (platform: HealthPlatformId, connected: boolean) => {
      dispatch(connected ? disconnectHealthPlatformThunk(platform) : connectHealthPlatformThunk(platform));
    },
    [dispatch]
  );

  return (
    <TabHeroLayout title="Health integrations" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        Each platform is connected through its own adapter and normalized into Longlivy's internal data
        model — no single provider is hard-wired into the app.
      </AppText>
      {SHOW_NOISE_SMARTWATCH ? (
        <HeroCard onPress={() => navigation.navigate('NoiseDevice')} scaleOnPress style={{ marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ marginRight: theme.spacing.sm }}>
                <AppIcon name="watch-outline" size={20} color="#FFFFFF" />
              </View>
              <View>
                <AppText variant="headingSmall" color="#FFFFFF">
                  Noise Smartwatch
                </AppText>
                {noiseConnectionState === 'connected' && noiseDeviceName ? (
                  <AppBadge label={`Connected · ${noiseDeviceName}`} tone="success" />
                ) : noiseConnectionState === 'idle' ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.45)">
                    Not connected
                  </AppText>
                ) : (
                  <AppBadge label={NOISE_STATE_COPY[noiseConnectionState].label} tone={NOISE_STATE_COPY[noiseConnectionState].tone} />
                )}
              </View>
            </View>
            <AppIcon name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
          </View>
        </HeroCard>
      ) : null}
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
        backgroundColor: connected ? 'rgba(255,255,255,0.08)' : 'rgba(95,191,174,0.22)',
        borderColor: connected ? 'rgba(255,255,255,0.14)' : 'rgba(95,191,174,0.5)',
      }}
    >
      <AppText variant="label" color={connected ? '#FFFFFF' : '#5C7A94'}>
        {connected ? 'Disconnect' : 'Connect'}
      </AppText>
    </HeroCard>
  );
};
