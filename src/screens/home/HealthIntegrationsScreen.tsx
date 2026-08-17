import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppBadge } from '@/components/common/AppBadge';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectHealthConnections } from '@/features/health/selectors';
import { connectHealthPlatformThunk, disconnectHealthPlatformThunk } from '@/features/health/healthIntegrationSlice';
import { HealthPlatformId } from '@/features/health/models';

export const HealthIntegrationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const connections = useAppSelector(selectHealthConnections);

  const toggle = useCallback(
    (platform: HealthPlatformId, connected: boolean) => {
      dispatch(connected ? disconnectHealthPlatformThunk(platform) : connectHealthPlatformThunk(platform));
    },
    [dispatch]
  );

  return (
    <>
      <AppHeader title="Health integrations" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Each platform is connected through its own adapter and normalized into Longlivy's internal data
          model — no single provider is hard-wired into the app.
        </AppText>
        {connections.map((c) => (
          <AppCard key={c.platform} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <AppText variant="headingSmall">{c.displayName}</AppText>
                {c.connected ? (
                  <AppBadge label={`Synced · ${c.lastSyncedAt ? new Date(c.lastSyncedAt).toLocaleTimeString() : ''}`} tone="success" />
                ) : (
                  <AppText variant="caption" color={theme.colors.textTertiary}>
                    Not connected
                  </AppText>
                )}
              </View>
              <AppButton
                label={c.connected ? 'Disconnect' : 'Connect'}
                onPress={() => toggle(c.platform, c.connected)}
                variant={c.connected ? 'outline' : 'primary'}
                fullWidth={false}
                style={{ paddingHorizontal: theme.spacing.md }}
              />
            </View>
          </AppCard>
        ))}
      </AppScreen>
    </>
  );
};
