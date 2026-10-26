import React, { useEffect } from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  refreshHealthConnectThunk,
  requestHealthConnectPermissionsThunk,
  openHealthConnectSettingsThunk,
} from '../healthConnectSlice';
import {
  selectHealthConnectStatus,
  selectHealthConnectRefreshStatus,
  selectHealthConnectGrantedRecordTypes,
  selectHealthConnectLastCheckedAt,
  selectHealthConnectLastDataReceivedAt,
  selectHealthConnectErrorMessage,
} from '../selectors';

const STATUS_COPY: Record<string, { label: string; tone: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  checking: { label: 'Checking…', tone: 'neutral' },
  unavailable: { label: 'Not available on this device', tone: 'neutral' },
  update_required: { label: 'Health Connect needs an update', tone: 'warning' },
  permission_required: { label: 'Permissions required', tone: 'warning' },
  ready: { label: 'Connected', tone: 'success' },
  error: { label: 'Sync error', tone: 'danger' },
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleString();
}

/**
 * Real Health Connect integration (reads device/wearable data already
 * written there by Google Fit, a smartwatch app, etc. — see
 * healthConnectService.ts) surfaced directly in Settings, as its own section
 * rather than a separate screen. Deliberately not wired to the
 * `features/health` slice used by the old hidden HealthIntegrationsScreen —
 * that one is backed by `MockHealthAdapter` and returns no real data.
 */
export const HealthConnectSettings: React.FC = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectHealthConnectStatus);
  const refreshStatus = useAppSelector(selectHealthConnectRefreshStatus);
  const grantedRecordTypes = useAppSelector(selectHealthConnectGrantedRecordTypes);
  const lastCheckedAt = useAppSelector(selectHealthConnectLastCheckedAt);
  const lastDataReceivedAt = useAppSelector(selectHealthConnectLastDataReceivedAt);
  const errorMessage = useAppSelector(selectHealthConnectErrorMessage);

  useEffect(() => {
    dispatch(refreshHealthConnectThunk());
  }, [dispatch]);

  const copy = STATUS_COPY[status] ?? STATUS_COPY.checking;
  const connected = status === 'ready';

  return (
    <HeroCard style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs }}>
        <AppText variant="bodyMedium" color="#FFFFFF">
          Health Connect
        </AppText>
        <AppBadge label={copy.label} tone={copy.tone} />
      </View>

      {connected ? (
        <>
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginTop: 2 }}>
            Last checked: {formatTimestamp(lastCheckedAt)}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.55)">
            Last data received: {formatTimestamp(lastDataReceivedAt)}
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginBottom: theme.spacing.sm }}>
            {grantedRecordTypes.length} data {grantedRecordTypes.length === 1 ? 'category' : 'categories'} permitted
          </AppText>
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
            <AppGradientButton
              label={refreshStatus === 'refreshing' ? 'Syncing…' : 'Sync now'}
              onPress={() => dispatch(refreshHealthConnectThunk())}
              loading={refreshStatus === 'refreshing'}
              fullWidth={false}
              style={{ flex: 1 }}
            />
            <AppGradientButton
              label="Manage permissions"
              onPress={() => dispatch(openHealthConnectSettingsThunk())}
              colors={['#3A3F4A', '#2A2E36']}
              fullWidth={false}
              style={{ flex: 1 }}
            />
          </View>
        </>
      ) : status === 'permission_required' ? (
        <>
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginBottom: theme.spacing.sm }}>
            Grant read access so LongLivy can show steps, heart rate, sleep and workout data already recorded by your watch or Google Fit.
          </AppText>
          <AppGradientButton label="Connect Health Connect" onPress={() => dispatch(requestHealthConnectPermissionsThunk())} />
        </>
      ) : status === 'error' ? (
        <>
          <AppText variant="caption" color="#F2A08F" style={{ marginBottom: theme.spacing.sm }}>
            {errorMessage ?? 'Could not reach Health Connect.'}
          </AppText>
          <AppGradientButton label="Retry" onPress={() => dispatch(refreshHealthConnectThunk())} />
        </>
      ) : status === 'update_required' ? (
        <AppText variant="caption" color="rgba(255,255,255,0.55)">
          Update the Health Connect app from the Play Store, then reopen this screen.
        </AppText>
      ) : status === 'unavailable' ? (
        <AppText variant="caption" color="rgba(255,255,255,0.55)">
          Health Connect isn't available on this device or Android version.
        </AppText>
      ) : null}
    </HeroCard>
  );
};
