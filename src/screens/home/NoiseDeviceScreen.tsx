import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Pressable, AppState, Linking, Alert, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppBadge } from '@/components/common/AppBadge';
import { AppButton } from '@/components/common/AppButton';
import { AppIcon } from '@/components/common/AppIcon';
import { AppSwitch } from '@/components/common/AppSwitch';
import { HeroTextField } from '@/components/common/HeroTextField';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store } from '@/store/store';
import {
  selectNoiseConnectionState,
  selectNoiseErrorMessage,
  selectDiscoveredNoiseDevices,
  selectConnectedNoiseDeviceName,
  selectConnectedNoiseDeviceId,
  selectLastKnownNoiseDeviceId,
  selectNoiseServices,
  selectNoiseDeviceInfo,
  selectNoiseActivityMetrics,
  selectNoisePacketStats,
  selectNoiseRawLog,
  selectNoiseSyncStatus,
  selectNoiseLastSyncedAt,
  selectNoiseSyncError,
  selectNoiseAutoSyncEnabled,
} from '@/features/noise/selectors';
import {
  startNoiseScanThunk,
  stopNoiseScanThunk,
  connectNoiseDeviceThunk,
  disconnectNoiseDeviceThunk,
  syncNowThunk,
  setAutoSyncThunk,
} from '@/features/noise/noiseSlice';
import { NoiseDiscoveredDevice, NoiseField, NoiseServiceInfo, NoiseConnectionState, SyncStatus, PacketStats, NOISE_STATE_COPY, FIELD_STATUS_COPY } from '@/features/noise/models';
import { getDeviceDisplayName, hasKnownName } from '@/features/noise/ble/deviceIdentity';
import { base64ToHex } from '@/features/noise/ble/base64';
import { STANDARD_UUIDS } from '@/features/noise/ble/standardGattParsers';
import { knownVendorChannelLabel } from '@/features/noise/ble/knownVendorChannels';
import {
  selectHealthConnectStatus,
  selectHealthConnectHasAllPermissions,
  selectHealthConnectGrantedRecordTypes,
  selectHealthConnectMetrics,
  selectHealthConnectDebugInfo,
  selectHealthConnectRefreshStatus,
  selectHealthConnectLastCheckedAt,
  selectHealthConnectLastDataReceivedAt,
  selectHealthConnectNewDataFieldKeys,
  selectHealthConnectErrorMessage,
} from '@/features/healthConnect/selectors';
import { refreshHealthConnectThunk, refreshWithBoundedRetryThunk, requestHealthConnectPermissionsThunk, openHealthConnectSettingsThunk } from '@/features/healthConnect/healthConnectSlice';
import {
  HealthConnectField,
  HealthConnectSource,
  REQUIRED_HC_METRIC_LABELS,
  summarizePipelineSources,
  findFreshestRecord,
  isGoogleFitSource,
  computeFitBridgeStatus,
  FitBridgeStatus,
} from '@/features/healthConnect/models';
import { runDeepRefresh, computePipelineVerdict, DeepRefreshResult, PipelineVerdict, PipelineStageStatus } from '@/features/healthConnect/healthConnectDiagnostics';
import {
  selectHealthKitStatus,
  selectHealthKitHasRequestedPermissions,
  selectHealthKitAuthorizationStatuses,
  selectHealthKitMetrics,
  selectHealthKitDebugInfo,
  selectHealthKitRefreshStatus,
  selectHealthKitLastCheckedAt,
  selectHealthKitLastDataReceivedAt,
  selectHealthKitNewDataFieldKeys,
  selectHealthKitErrorMessage,
} from '@/features/healthKit/selectors';
import { refreshHealthKitThunk, refreshWithBoundedRetryThunk as refreshHealthKitWithBoundedRetryThunk, requestHealthKitPermissionsThunk } from '@/features/healthKit/healthKitSlice';
import { HealthKitField, HealthKitSource, REQUIRED_HK_METRIC_LABELS } from '@/features/healthKit/models';
import { computePipelineVerdict as computeHealthKitPipelineVerdict, PipelineVerdict as HealthKitPipelineVerdict, PipelineStageStatus as HealthKitPipelineStageStatus } from '@/features/healthKit/healthKitDiagnostics';

/** Android's App Links scheme for launching another app's launcher activity by package name, if installed. Standard platform mechanism, not a guess. */
const NOISEFIT_PACKAGE = 'com.noisefit';

/**
 * Health Connect (Android) and HealthKit (iOS) integration work is paused
 * per explicit instruction — no automatic fetching/syncing/permission
 * requests, and every button that would trigger one is disabled (visible,
 * non-interactive) rather than removed. The rest of this screen (BLE watch
 * connection, diagnostics UI) is untouched. Flip back to false to resume
 * — nothing else needs to change.
 */
const HEALTH_INTEGRATIONS_PAUSED = true;

// A realtime field with no update in this long counts as "Stale" rather
// than "Live" — long enough that a normal notify cadence (roughly once a
// second for heart rate) never flickers between the two.
const LIVE_THRESHOLD_MS = 10_000;

const SYNC_STATUS_COPY: Record<SyncStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  idle: { label: 'Not synced yet', tone: 'neutral' },
  syncing: { label: 'Synchronizing…', tone: 'info' },
  success: { label: 'Up to date', tone: 'success' },
  error: { label: 'Sync failed', tone: 'danger' },
};

const HC_STATUS_COPY: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  checking: { label: 'Checking…', tone: 'neutral' },
  unavailable: { label: 'Not Available', tone: 'danger' },
  update_required: { label: 'Update Required', tone: 'warning' },
  permission_required: { label: 'Permission Required', tone: 'warning' },
  ready: { label: 'Connected ✓', tone: 'success' },
  error: { label: 'Error', tone: 'danger' },
};

const HC_REFRESH_STATUS_COPY: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  idle: { label: 'Not checked yet', tone: 'neutral' },
  refreshing: { label: 'Checking…', tone: 'info' },
  success: { label: 'Up to date', tone: 'success' },
  error: { label: 'Refresh failed', tone: 'danger' },
};

const PIPELINE_STAGE_STATUS_COPY: Record<PipelineStageStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  new: { label: '✓ New', tone: 'success' },
  old: { label: '⏳ Old', tone: 'warning' },
  missing: { label: '✗ Missing', tone: 'danger' },
  unknown: { label: '? Unknown', tone: 'neutral' },
};

const FIT_BRIDGE_STATUS_COPY: Record<FitBridgeStatus, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  receiving: { label: 'Receiving new Fit data', tone: 'success' },
  delayed: { label: 'Delayed', tone: 'warning' },
  no_data: { label: 'No new Fit data observed', tone: 'neutral' },
  unknown: { label: 'Unknown', tone: 'neutral' },
};

const HK_STATUS_COPY: Record<string, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  checking: { label: 'Checking…', tone: 'neutral' },
  unavailable: { label: 'HealthKit Unavailable', tone: 'danger' },
  permission_required: { label: 'Permission Required', tone: 'warning' },
  ready: { label: 'Connected ✓', tone: 'success' },
  error: { label: 'Error', tone: 'danger' },
};

const HK_AUTH_STATUS_COPY: Record<string, string> = {
  authorized: '✓ Authorized',
  not_authorized: '✗ Not Authorized',
  unknown: '? Unknown',
};

/** "54 min ago" / "2h 10m ago" — used everywhere a Health Connect field's recordedAt needs to be shown honestly as an age, never implied as live. */
function formatAge(iso: string | null, now: number): string {
  if (!iso) return '—';
  const totalMinutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (totalMinutes < 1) return 'just now';
  if (totalMinutes < 60) return `${totalMinutes} min ago`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
}

// Which Bluetooth-SIG standard *service* would have to be present on THIS
// specific connected device for this app to have any chance of decoding
// this field — used only to give an honest, per-device "why is this Not
// Available" hint, never to fake a value. Checked against the services
// actually discovered on the currently connected watch (see
// deviceHasStandardService), not assumed present. Fields with no entry here
// have no Bluetooth-standard source at all, on any device.
const STANDARD_SOURCE_SERVICE_BY_LABEL: Record<string, string> = {
  'Device Name': STANDARD_UUIDS.genericAccessService,
  Manufacturer: STANDARD_UUIDS.deviceInformationService,
  Model: STANDARD_UUIDS.deviceInformationService,
  'Serial Number': STANDARD_UUIDS.deviceInformationService,
  Firmware: STANDARD_UUIDS.deviceInformationService,
  Hardware: STANDARD_UUIDS.deviceInformationService,
  'Battery Level': STANDARD_UUIDS.batteryService,
  'Heart Rate': STANDARD_UUIDS.heartRateService,
  'Avg Heart Rate (session)': STANDARD_UUIDS.heartRateService,
  'Max Heart Rate (session)': STANDARD_UUIDS.heartRateService,
  'Min Heart Rate (session)': STANDARD_UUIDS.heartRateService,
  Calories: STANDARD_UUIDS.heartRateService,
  Pace: STANDARD_UUIDS.runningSpeedAndCadenceService,
  'Avg Pace (session)': STANDARD_UUIDS.runningSpeedAndCadenceService,
  Speed: STANDARD_UUIDS.runningSpeedAndCadenceService,
  'Avg Speed (session)': STANDARD_UUIDS.runningSpeedAndCadenceService,
  Cadence: STANDARD_UUIDS.runningSpeedAndCadenceService,
  Distance: STANDARD_UUIDS.runningSpeedAndCadenceService,
};

function deviceHasStandardService(services: NoiseServiceInfo[], label: string): boolean {
  const required = STANDARD_SOURCE_SERVICE_BY_LABEL[label];
  if (!required) return false;
  return services.some((s) => s.uuid.toLowerCase() === required.toLowerCase());
}

/** Human-readable cadence for a characteristic's packet rate — used only to describe observed behavior, never to imply meaning. */
function formatChangeFrequency(packetsPerSecond: number): string {
  if (!Number.isFinite(packetsPerSecond) || packetsPerSecond <= 0) return 'once';
  if (packetsPerSecond >= 0.5) return `~${packetsPerSecond.toFixed(1)}/sec`;
  const seconds = 1 / packetsPerSecond;
  return seconds < 60 ? `~every ${seconds.toFixed(1)}s` : `~every ${(seconds / 60).toFixed(1)}m`;
}

/**
 * A raw byte-offset diff between two snapshots of the same characteristic's
 * last-seen payload, taken at two moments the user marks as "before"/"after"
 * a known real-world change (see the Ground Truth Analyzer section). This is
 * NOT a claim that the offset means anything — `matchesTarget` only says the
 * byte-level delta happens to line up with the value the user typed in, and
 * every result is rendered with an explicit "NOT VERIFIED" label. Nothing
 * here is ever written back to the watch or used to build a parser
 * automatically; a human still has to look at the result and decide.
 */
interface GroundTruthCandidate {
  characteristicUUID: string;
  offset: number;
  beforeByte: number;
  afterByte: number;
  delta: number;
  matchesTarget: boolean;
}

function analyzeGroundTruth(baseline: PacketStats[], afterSnapshot: PacketStats[], beforeValue: number, afterValue: number): GroundTruthCandidate[] {
  const targetDelta = afterValue - beforeValue;
  const baselineByUUID = new Map(baseline.map((p) => [p.characteristicUUID, p]));
  const candidates: GroundTruthCandidate[] = [];

  for (const after of afterSnapshot) {
    const before = baselineByUUID.get(after.characteristicUUID);
    if (!before) continue;
    const b = before.lastDecimalBytes;
    const a = after.lastDecimalBytes;
    if (b.length !== a.length) continue;
    for (let i = 0; i < a.length; i++) {
      if (b[i] === a[i]) continue;
      const delta = a[i] - b[i];
      candidates.push({
        characteristicUUID: after.characteristicUUID,
        offset: i,
        beforeByte: b[i],
        afterByte: a[i],
        delta,
        matchesTarget: delta === targetDelta || a[i] === afterValue || b[i] === beforeValue,
      });
    }
  }
  return candidates.sort((x, y) => Number(y.matchesTarget) - Number(x.matchesTarget));
}

export const NoiseDeviceScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const connectionState = useAppSelector(selectNoiseConnectionState);
  const errorMessage = useAppSelector(selectNoiseErrorMessage);
  const devices = useAppSelector(selectDiscoveredNoiseDevices);
  const connectedDeviceName = useAppSelector(selectConnectedNoiseDeviceName);
  const connectedOrConnectingDeviceId = useAppSelector(selectConnectedNoiseDeviceId);
  const lastKnownDeviceId = useAppSelector(selectLastKnownNoiseDeviceId);
  const services = useAppSelector(selectNoiseServices);
  const deviceInfo = useAppSelector(selectNoiseDeviceInfo);
  const activityMetrics = useAppSelector(selectNoiseActivityMetrics);
  const packetStats = useAppSelector(selectNoisePacketStats);
  const rawLog = useAppSelector(selectNoiseRawLog);
  const syncStatus = useAppSelector(selectNoiseSyncStatus);
  const lastSyncedAt = useAppSelector(selectNoiseLastSyncedAt);
  const syncError = useAppSelector(selectNoiseSyncError);
  const autoSyncEnabled = useAppSelector(selectNoiseAutoSyncEnabled);

  const hcStatus = useAppSelector(selectHealthConnectStatus);
  const hcHasAllPermissions = useAppSelector(selectHealthConnectHasAllPermissions);
  const hcGrantedRecordTypes = useAppSelector(selectHealthConnectGrantedRecordTypes);
  const hcMetrics = useAppSelector(selectHealthConnectMetrics);
  const hcDebugInfo = useAppSelector(selectHealthConnectDebugInfo);
  const hcRefreshStatus = useAppSelector(selectHealthConnectRefreshStatus);
  const hcLastCheckedAt = useAppSelector(selectHealthConnectLastCheckedAt);
  const hcLastDataReceivedAt = useAppSelector(selectHealthConnectLastDataReceivedAt);
  const hcNewDataFieldKeys = useAppSelector(selectHealthConnectNewDataFieldKeys);
  const hcErrorMessage = useAppSelector(selectHealthConnectErrorMessage);

  // Set right before launching NoiseFit, so the very next foreground return
  // gets the bounded 3-attempt retry (NoiseFit -> Google Fit -> Health
  // Connect all need a moment to settle) instead of a single too-early
  // refresh. Any OTHER foreground return (switching apps, unlocking the
  // phone) just gets the normal single refresh below — this is deliberately
  // NOT a general-purpose poll trigger.
  const awaitingNoiseFitReturn = useRef(false);

  // Health Connect refresh points, per spec: app open, returning to
  // foreground, opening this screen, and the explicit Refresh Health Data
  // button below — never a tight poll. This is a completely separate data
  // path from the BLE sync above: it never sends anything to the watch, and
  // it never asks NoiseFit/Google Fit to sync — no supported API exists for
  // that (see healthConnectService.ts) — it only re-reads whatever they've
  // already written into Android's Health Connect.
  useFocusEffect(
    useCallback(() => {
      if (!HEALTH_INTEGRATIONS_PAUSED && Platform.OS === 'android') dispatch(refreshHealthConnectThunk());
    }, [dispatch])
  );
  useEffect(() => {
    if (HEALTH_INTEGRATIONS_PAUSED || Platform.OS !== 'android') return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') return;
      if (awaitingNoiseFitReturn.current) {
        awaitingNoiseFitReturn.current = false;
        dispatch(refreshWithBoundedRetryThunk());
      } else {
        dispatch(refreshHealthConnectThunk());
      }
    });
    return () => subscription.remove();
  }, [dispatch]);

  const hkStatus = useAppSelector(selectHealthKitStatus);
  const hkHasRequestedPermissions = useAppSelector(selectHealthKitHasRequestedPermissions);
  const hkAuthorizationStatuses = useAppSelector(selectHealthKitAuthorizationStatuses);
  const hkMetrics = useAppSelector(selectHealthKitMetrics);
  const hkDebugInfo = useAppSelector(selectHealthKitDebugInfo);
  const hkRefreshStatus = useAppSelector(selectHealthKitRefreshStatus);
  const hkLastCheckedAt = useAppSelector(selectHealthKitLastCheckedAt);
  const hkLastDataReceivedAt = useAppSelector(selectHealthKitLastDataReceivedAt);
  const hkNewDataFieldKeys = useAppSelector(selectHealthKitNewDataFieldKeys);
  const hkErrorMessage = useAppSelector(selectHealthKitErrorMessage);

  // Set right before the user switches to Apple Health/another health app,
  // so the next foreground return gets the bounded 3-attempt retry instead
  // of a single too-early refresh. AppState can't tell us WHICH app the
  // user went to, so this flips true on ANY backgrounding while the
  // Apple Health card is visible — a slightly wider net than Android's
  // NoiseFit-specific flag, but still bounded, never a continuous poll.
  const awaitingHealthAppReturn = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!HEALTH_INTEGRATIONS_PAUSED && Platform.OS === 'ios') dispatch(refreshHealthKitThunk());
    }, [dispatch])
  );
  useEffect(() => {
    if (HEALTH_INTEGRATIONS_PAUSED || Platform.OS !== 'ios') return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        awaitingHealthAppReturn.current = true;
        return;
      }
      if (nextState !== 'active') return;
      if (awaitingHealthAppReturn.current) {
        awaitingHealthAppReturn.current = false;
        dispatch(refreshHealthKitWithBoundedRetryThunk());
      } else {
        dispatch(refreshHealthKitThunk());
      }
    });
    return () => subscription.remove();
  }, [dispatch]);

  const handleGrantHealthKitPermissions = useCallback(() => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    dispatch(requestHealthKitPermissionsThunk());
  }, [dispatch]);
  const handleHealthKitRefresh = useCallback(() => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    dispatch(refreshHealthKitThunk());
  }, [dispatch]);

  const [hkDeepRefreshVerdict, setHkDeepRefreshVerdict] = useState<HealthKitPipelineVerdict | null>(null);
  const [isHkDeepRefreshing, setIsHkDeepRefreshing] = useState(false);
  const handleHealthKitDeepRefresh = useCallback(async () => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    setIsHkDeepRefreshing(true);
    const beforeHeartRateRecordedAt = store.getState().healthKit.metrics.heartRateBpm.recordedAt;
    const beforeStepsRecordedAt = store.getState().healthKit.metrics.steps.recordedAt;
    try {
      await dispatch(refreshHealthKitThunk());
      const afterState = store.getState().healthKit;
      const verdict = computeHealthKitPipelineVerdict({
        beforeHeartRateRecordedAt,
        beforeStepsRecordedAt,
        afterMetrics: afterState.metrics,
        longlivyHeartRateRecordedAtAfterRefresh: afterState.metrics.heartRateBpm.recordedAt,
        longlivyStepsRecordedAtAfterRefresh: afterState.metrics.steps.recordedAt,
      });
      setHkDeepRefreshVerdict(verdict);
    } finally {
      setIsHkDeepRefreshing(false);
    }
  }, [dispatch]);

  const handleGrantHealthConnectPermissions = useCallback(() => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    dispatch(requestHealthConnectPermissionsThunk());
  }, [dispatch]);
  const handleOpenHealthConnectSettings = useCallback(() => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    dispatch(openHealthConnectSettingsThunk());
  }, [dispatch]);
  const handleHealthConnectRefresh = useCallback(() => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    dispatch(refreshHealthConnectThunk());
  }, [dispatch]);
  const handleOpenNoiseFit = useCallback(async () => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    const url = `android-app://${NOISEFIT_PACKAGE}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('NoiseFit not found', 'NoiseFit doesn\'t appear to be installed on this device.');
      return;
    }
    awaitingNoiseFitReturn.current = true;
    await Linking.openURL(url);
  }, []);

  // TEMPORARY diagnostics: local-only, deliberately not stored in Redux (see
  // healthConnectDiagnostics.ts doc comment) — pinpoints exactly which stage
  // of Noise Brio -> NoiseFit -> Google Fit -> Health Connect -> LongLivy a
  // new measurement is stuck at, instead of guessing.
  const [deepRefreshResult, setDeepRefreshResult] = useState<DeepRefreshResult | null>(null);
  const [pipelineVerdict, setPipelineVerdict] = useState<PipelineVerdict | null>(null);
  const [isDeepRefreshing, setIsDeepRefreshing] = useState(false);
  const handleDeepRefresh = useCallback(async () => {
    if (HEALTH_INTEGRATIONS_PAUSED) return;
    setIsDeepRefreshing(true);
    const beforeHeartRateRecordedAt = store.getState().healthConnect.metrics.heartRateBpm.recordedAt;
    const beforeStepsRecordedAt = store.getState().healthConnect.metrics.steps.recordedAt;
    try {
      const result = await runDeepRefresh();
      await dispatch(refreshHealthConnectThunk());
      const afterState = store.getState().healthConnect.metrics;
      const verdict = computePipelineVerdict({
        isWatchBleConnected: connectionState === 'connected',
        beforeHeartRateRecordedAt,
        beforeStepsRecordedAt,
        afterHeartRateDiagnostic: result.heartRate,
        afterStepsDiagnostic: result.steps,
        longlivyHeartRateRecordedAtAfterRefresh: afterState.heartRateBpm.recordedAt,
        longlivyStepsRecordedAtAfterRefresh: afterState.steps.recordedAt,
      });
      setDeepRefreshResult(result);
      setPipelineVerdict(verdict);
    } finally {
      setIsDeepRefreshing(false);
    }
  }, [dispatch, connectionState]);

  // Drives every "updated Xs ago" label — BLE data doesn't arrive on a
  // schedule, so something has to force a re-render every second purely
  // for wall-clock time to visibly move, otherwise a field that stopped
  // updating would silently freeze at "3s ago" forever.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (connectionState === 'scanning') dispatch(stopNoiseScanThunk());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanPress = useCallback(() => {
    if (connectionState === 'scanning') dispatch(stopNoiseScanThunk());
    else dispatch(startNoiseScanThunk());
  }, [connectionState, dispatch]);

  const handleDevicePress = useCallback((device: NoiseDiscoveredDevice) => dispatch(connectNoiseDeviceThunk(device.id)), [dispatch]);
  const handleDisconnect = useCallback(() => dispatch(disconnectNoiseDeviceThunk()), [dispatch]);
  const handleReconnect = useCallback(() => {
    if (lastKnownDeviceId) dispatch(connectNoiseDeviceThunk(lastKnownDeviceId));
  }, [dispatch, lastKnownDeviceId]);
  const handleSyncNow = useCallback(() => dispatch(syncNowThunk()), [dispatch]);
  const handleAutoSyncToggle = useCallback((value: boolean) => dispatch(setAutoSyncThunk(value)), [dispatch]);

  const [deviceFilter, setDeviceFilter] = useState<'all' | 'noise'>('all');
  const [expandedDeviceId, setExpandedDeviceId] = useState<string | null>(null);

  // Ground Truth Analyzer — purely a local diagnostic tool, not app state:
  // snapshots the already-captured packetStats at two moments the user
  // marks, then diffs them byte-by-byte. Never writes to the watch, never
  // labels anything as verified.
  const [gtMetricName, setGtMetricName] = useState('Steps');
  const [gtBeforeValue, setGtBeforeValue] = useState('');
  const [gtAfterValue, setGtAfterValue] = useState('');
  const [gtBaseline, setGtBaseline] = useState<PacketStats[] | null>(null);
  const [gtAfterSnapshot, setGtAfterSnapshot] = useState<PacketStats[] | null>(null);
  const [gtResults, setGtResults] = useState<GroundTruthCandidate[] | null>(null);

  const handleCaptureBaseline = useCallback(() => {
    setGtBaseline(packetStats.map((p) => ({ ...p })));
    setGtAfterSnapshot(null);
    setGtResults(null);
  }, [packetStats]);
  const handleCaptureAfter = useCallback(() => {
    setGtAfterSnapshot(packetStats.map((p) => ({ ...p })));
    setGtResults(null);
  }, [packetStats]);
  const handleAnalyzeGroundTruth = useCallback(() => {
    if (!gtBaseline || !gtAfterSnapshot) return;
    const before = Number(gtBeforeValue);
    const after = Number(gtAfterValue);
    if (!Number.isFinite(before) || !Number.isFinite(after)) return;
    setGtResults(analyzeGroundTruth(gtBaseline, gtAfterSnapshot, before, after));
  }, [gtBaseline, gtAfterSnapshot, gtBeforeValue, gtAfterValue]);
  const handleResetGroundTruth = useCallback(() => {
    setGtBaseline(null);
    setGtAfterSnapshot(null);
    setGtResults(null);
  }, []);

  const isConnected = connectionState === 'connected';
  const isReconnecting = connectionState === 'reconnecting';
  const canScan = connectionState !== 'connecting' && connectionState !== 'connected' && connectionState !== 'reconnecting';
  const stateCopy = NOISE_STATE_COPY[connectionState];

  // Scan → identify → user selects → connect. Never auto-picked — every row
  // needs an explicit tap. Sort: likely-Noise first, then any named device,
  // then strongest signal, unnamed devices last (but never hidden — see
  // DeviceCard's Details expansion for identifying them from raw advertisement data).
  const sortedDevices = devices
    .filter((d) => deviceFilter === 'all' || d.isLikelySuggestedMatch)
    .slice()
    .sort((a, b) => {
      if (a.isLikelySuggestedMatch !== b.isLikelySuggestedMatch) return a.isLikelySuggestedMatch ? -1 : 1;
      const aNamed = hasKnownName(a);
      const bNamed = hasKnownName(b);
      if (aNamed !== bNamed) return aNamed ? -1 : 1;
      return (b.rssi ?? -999) - (a.rssi ?? -999);
    });
  const noiseMatches = sortedDevices.filter((d) => d.isLikelySuggestedMatch);
  const otherDevices = sortedDevices.filter((d) => !d.isLikelySuggestedMatch);

  // Everything the user actually asked to see up front — grouped exactly as
  // requested (Activity / Health / Sleep). Device Information on the main
  // screen is deliberately just name + id; every other technical field
  // lives in the Developer / BLE Debug section further down.
  const minimalDeviceFields: [string, NoiseField<unknown>][] = [
    ['Device Name', deviceInfo.deviceName],
    ['Device ID', deviceInfo.deviceId],
  ];
  const workoutFields: [string, NoiseField<unknown>][] = [
    ['Activity Type', activityMetrics.activityType],
    ['Workout State', activityMetrics.workoutState],
    ['Duration', activityMetrics.durationSeconds],
  ];
  const activityPriorityFields: [string, NoiseField<unknown>][] = [
    ['Steps', activityMetrics.steps],
    ['Calories', activityMetrics.caloriesKcal],
    ['Distance', activityMetrics.distanceMeters],
  ];
  const healthFields: [string, NoiseField<unknown>][] = [
    ['Heart Rate', activityMetrics.heartRateBpm],
    ['Stress', activityMetrics.stressLevel],
    ['Blood O₂', activityMetrics.spo2Percent],
  ];
  const sleepFields: [string, NoiseField<unknown>][] = [
    ['Sleep Duration', activityMetrics.sleepDurationMinutes],
    ['Deep', activityMetrics.sleepDeepMinutes],
    ['Light', activityMetrics.sleepLightMinutes],
    ['REM', activityMetrics.sleepRemMinutes],
    ['Awake', activityMetrics.sleepAwakeMinutes],
  ];

  // Developer / BLE Debug only — technical device metadata, battery, and
  // secondary/derived metrics nobody asked to see on the main screen.
  const debugDeviceFields: [string, NoiseField<unknown>][] = [
    ['Manufacturer', deviceInfo.manufacturer],
    ['Model', deviceInfo.model],
    ['Serial Number', deviceInfo.serialNumber],
    ['Firmware', deviceInfo.firmwareRevision],
    ['Hardware', deviceInfo.hardwareRevision],
    ['Software', deviceInfo.softwareRevision],
    ['Signal (RSSI)', deviceInfo.rssi],
  ];
  const batteryFields: [string, NoiseField<unknown>][] = [
    ['Battery Level', deviceInfo.batteryPercent],
    ['Charging', deviceInfo.batteryCharging],
  ];
  const extendedMetricFields: [string, NoiseField<unknown>][] = [
    ['Active Calories', activityMetrics.activeCaloriesKcal],
    ['Avg Heart Rate (session)', activityMetrics.avgHeartRateBpm],
    ['Max Heart Rate (session)', activityMetrics.maxHeartRateBpm],
    ['Min Heart Rate (session)', activityMetrics.minHeartRateBpm],
    ['Pace', activityMetrics.paceMinPerKm],
    ['Avg Pace (session)', activityMetrics.avgPaceMinPerKm],
    ['Speed', activityMetrics.speedMetersPerSecond],
    ['Avg Speed (session)', activityMetrics.avgSpeedMetersPerSecond],
    ['Cadence', activityMetrics.cadenceRpm],
    ['Elevation', activityMetrics.elevationMeters],
    ['Floors', activityMetrics.floors],
    ['GPS Available', activityMetrics.gpsAvailable],
    ['Sleep Summary', activityMetrics.sleepData],
  ];

  const allFields = [
    ...minimalDeviceFields,
    ...debugDeviceFields,
    ...batteryFields,
    ...workoutFields,
    ...activityPriorityFields,
    ...healthFields,
    ...sleepFields,
    ...extendedMetricFields,
  ];
  const liveFields = allFields.filter(([, field]) => field.isRealtime && field.status !== 'not_available');
  const unknownStats = packetStats.filter((p) => p.parsedAs === null);
  const syncStatusCopy = SYNC_STATUS_COPY[syncStatus];
  const isSyncing = syncStatus === 'syncing';

  // Live BLE diagnostic summary — every number here comes straight from
  // already-discovered services/characteristics and already-tracked packet
  // stats, no new BLE calls.
  const allCharacteristics = services.flatMap((s) => s.characteristics);
  const notifiableCount = allCharacteristics.filter((c) => c.isNotifiable || c.isIndicatable).length;
  const totalPacketsReceived = packetStats.reduce((sum, p) => sum + p.totalPackets, 0);

  // Which pipeline stages LongLivy can actually see data from, derived only
  // from source metadata already present in hcDebugInfo — never asserted.
  const pipelineSummary = summarizePipelineSources(hcDebugInfo);

  // Google Fit / Health Connect Bridge diagnostic — every value is a real
  // record already pulled by fetchDebugInfo, never a synthesized one.
  const freshestOverallRecord = findFreshestRecord(hcDebugInfo);
  const freshestGoogleFitRecord = findFreshestRecord(hcDebugInfo, isGoogleFitSource);
  const fitBridgeStatus: FitBridgeStatus = computeFitBridgeStatus(freshestGoogleFitRecord?.time ?? null, now);

  return (
    <TabHeroLayout title="Noise Smartwatch" onBack={() => navigation.goBack()}>
      {/* Watch Connection (BLE) — deliberately separate from the Health Data card below.
          This badge reflects ONLY the live Bluetooth link to the physical watch; it says
          nothing about whether Health Connect has data, since that flows through an
          entirely different path (NoiseFit -> Google Fit -> Health Connect) that works
          independently of whether the watch is connected to LongLivy right now. */}
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: theme.spacing.xs }}>
              <AppIcon name="watch-outline" size={20} color="#FFFFFF" />
            </View>
            <View>
              <AppText variant="headingSmall" color="#FFFFFF">
                Watch Connection
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.4)">
                BLE
              </AppText>
            </View>
          </View>
          <AppBadge label={stateCopy.label} tone={stateCopy.tone} />
        </View>
        {isConnected ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            {minimalDeviceFields.map(([label, field]) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  {label}
                </AppText>
                <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                  {formatValue(field)}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}
        {errorMessage &&
        (connectionState === 'error' || connectionState === 'bluetooth_unavailable' || connectionState === 'permission_denied' || connectionState === 'reconnecting' || connectionState === 'disconnected') ? (
          <AppText variant="bodySmall" color={connectionState === 'reconnecting' ? 'rgba(255,190,120,0.9)' : 'rgba(255,120,120,0.9)'} style={{ marginTop: 4 }}>
            {errorMessage}
          </AppText>
        ) : null}
      </HeroCard>

      {/* Health Connect — Android only. A completely separate data path from the BLE
          connection above. This never talks to the watch directly; it only reads what
          NoiseFit/Google Fit have already written into Android's Health Connect, via the
          verified Noise Brio -> NoiseFit -> Google Fit -> Health Connect pipeline. It works
          whether or not the watch is currently connected over Bluetooth. */}
      {Platform.OS === 'android' ? (
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: theme.spacing.xs }}>
              <AppIcon name="heart-outline" size={20} color="#FFFFFF" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF">
              Health Data
            </AppText>
          </View>
          <AppBadge label={HEALTH_INTEGRATIONS_PAUSED ? 'Not Connected' : HC_STATUS_COPY[hcStatus].label} tone={HEALTH_INTEGRATIONS_PAUSED ? 'neutral' : HC_STATUS_COPY[hcStatus].tone} />
        </View>

        {HEALTH_INTEGRATIONS_PAUSED ? (
          <>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              Longlivy needs permission to read Activity, Vitals, Sleep and Body data from Health Connect — this is where your
              NoiseFit / Google Fit data actually lives once synced from the watch.
            </AppText>
            <AppButton label="Connect Health Data" onPress={handleGrantHealthConnectPermissions} disabled />
          </>
        ) : hcStatus === 'unavailable' ? (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm }}>
            Health Connect isn't available on this device.
          </AppText>
        ) : hcStatus === 'update_required' ? (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm }}>
            The Health Connect app needs to be updated from the Play Store before Longlivy can read data from it.
          </AppText>
        ) : hcStatus === 'permission_required' ? (
          <>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              Longlivy needs permission to read Activity, Vitals, Sleep and Body data from Health Connect — this is where your
              NoiseFit / Google Fit data actually lives once synced from the watch.
            </AppText>
            <AppButton label="Connect Health Data" onPress={handleGrantHealthConnectPermissions} />
          </>
        ) : hcStatus === 'error' ? (
          <AppText variant="bodySmall" color="rgba(255,120,120,0.85)" style={{ marginTop: theme.spacing.sm }}>
            {hcErrorMessage ?? 'Something went wrong reading Health Connect.'}
          </AppText>
        ) : hcStatus === 'ready' ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Last data received
              </AppText>
              <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                {hcLastDataReceivedAt ? `${new Date(hcLastDataReceivedAt).toLocaleTimeString()} (${formatAge(hcLastDataReceivedAt, now)})` : 'Not Available'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Last checked
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
                {hcLastCheckedAt ? new Date(hcLastCheckedAt).toLocaleTimeString() : '—'}
              </AppText>
            </View>

            {hcNewDataFieldKeys.length > 0 ? (
              <View style={{ alignSelf: 'flex-start', marginTop: theme.spacing.sm }}>
                <AppBadge label="New data received ✓" tone="success" />
              </View>
            ) : hcRefreshStatus === 'success' ? (
              <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginTop: theme.spacing.sm }}>
                No newer Health Connect record available yet.
              </AppText>
            ) : null}

            <AppButton
              label={hcRefreshStatus === 'refreshing' ? 'Checking…' : 'Refresh Health Data'}
              onPress={handleHealthConnectRefresh}
              disabled={hcRefreshStatus === 'refreshing'}
              variant="outline"
              style={{ marginTop: theme.spacing.sm }}
            />
            <AppButton label="Open NoiseFit" onPress={handleOpenNoiseFit} variant="outline" style={{ marginTop: theme.spacing.sm }} />
            <AppText variant="caption" color="rgba(255,255,255,0.35)" style={{ marginTop: theme.spacing.xs }}>
              Refresh Health Data re-reads whatever NoiseFit/Google Fit have already written to Health Connect — it cannot
              command the watch or NoiseFit to sync right now (no supported API exists for that). If you need the very latest
              reading, tap Open NoiseFit and sync there first; LongLivy checks Health Connect again automatically when you
              return.
            </AppText>
            <AppText variant="caption" color="rgba(255,255,255,0.3)" style={{ marginTop: theme.spacing.xs }}>
              Health data availability depends on when NoiseFit synchronizes the watch data to Google Fit and when Google Fit
              makes it available through Health Connect.
            </AppText>
          </View>
        ) : null}
      </HeroCard>
      ) : null}

      {/* Apple Health — iOS only. A completely separate data path from the BLE connection
          above; LongLivy never talks to the watch directly here, it only reads whatever is
          already in Apple Health via HealthKit: Health Source -> Apple Health -> LongLivy.
          Works whether or not a watch is currently connected over Bluetooth. */}
      {Platform.OS === 'ios' ? (
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ marginRight: theme.spacing.xs }}>
              <AppIcon name="heart-outline" size={20} color="#FFFFFF" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF">
              Apple Health
            </AppText>
          </View>
          <AppBadge label={HEALTH_INTEGRATIONS_PAUSED ? 'Not Connected' : HK_STATUS_COPY[hkStatus].label} tone={HEALTH_INTEGRATIONS_PAUSED ? 'neutral' : HK_STATUS_COPY[hkStatus].tone} />
        </View>

        {HEALTH_INTEGRATIONS_PAUSED ? (
          <>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              Longlivy needs permission to read Activity, Vitals, Sleep and Body data from Apple Health.
            </AppText>
            <AppButton label="Connect Apple Health" onPress={handleGrantHealthKitPermissions} disabled />
          </>
        ) : hkStatus === 'unavailable' ? (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm }}>
            HealthKit isn't available on this device.
          </AppText>
        ) : hkStatus === 'permission_required' ? (
          <>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
              Longlivy needs permission to read Activity, Vitals, Sleep and Body data from Apple Health.
            </AppText>
            <AppButton label="Connect Apple Health" onPress={handleGrantHealthKitPermissions} />
          </>
        ) : hkStatus === 'error' ? (
          <AppText variant="bodySmall" color="rgba(255,120,120,0.85)" style={{ marginTop: theme.spacing.sm }}>
            {hkErrorMessage ?? 'Something went wrong reading Apple Health.'}
          </AppText>
        ) : hkStatus === 'ready' ? (
          <View style={{ marginTop: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Last data received
              </AppText>
              <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                {hkLastDataReceivedAt ? `${new Date(hkLastDataReceivedAt).toLocaleTimeString()} (${formatAge(hkLastDataReceivedAt, now)})` : 'Not Available'}
              </AppText>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Last checked
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
                {hkLastCheckedAt ? new Date(hkLastCheckedAt).toLocaleTimeString() : '—'}
              </AppText>
            </View>

            {hkNewDataFieldKeys.length > 0 ? (
              <View style={{ alignSelf: 'flex-start', marginTop: theme.spacing.sm }}>
                <AppBadge label="New data received ✓" tone="success" />
              </View>
            ) : hkRefreshStatus === 'success' ? (
              <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginTop: theme.spacing.sm }}>
                No newer HealthKit record is available yet.
              </AppText>
            ) : null}

            <AppButton
              label={hkRefreshStatus === 'refreshing' ? 'Checking…' : 'Refresh Health Data'}
              onPress={handleHealthKitRefresh}
              disabled={hkRefreshStatus === 'refreshing'}
              variant="outline"
              style={{ marginTop: theme.spacing.sm }}
            />
            <AppText variant="caption" color="rgba(255,255,255,0.35)" style={{ marginTop: theme.spacing.xs }}>
              Refresh Health Data re-reads whatever is already in Apple Health — it cannot command the Apple Watch or any
              health source to sync right now. HealthKit can only return data that has already been written to it. If you need
              the very latest reading, open Apple Health directly first; LongLivy checks HealthKit again automatically when
              you return.
            </AppText>
          </View>
        ) : null}
      </HeroCard>
      ) : null}

      {Platform.OS === 'ios' && hkStatus === 'ready' ? (
        <>
          <Section title="Activity" defaultOpen>
            <HealthKitFieldRow label="Steps" field={hkMetrics.steps} now={now} isNew={hkNewDataFieldKeys.includes('steps')} />
            <HealthKitFieldRow label="Distance" field={hkMetrics.distanceKm} unit="km" now={now} isNew={hkNewDataFieldKeys.includes('distanceKm')} />
            <HealthKitFieldRow label="Active Calories" field={hkMetrics.activeCaloriesKcal} unit="kcal" now={now} isNew={hkNewDataFieldKeys.includes('activeCaloriesKcal')} />
            <HealthKitFieldRow label="Exercise" field={hkMetrics.exerciseMinutes} unit="min" now={now} isNew={hkNewDataFieldKeys.includes('exerciseMinutes')} />
          </Section>

          <Section title="Vitals" defaultOpen>
            <HealthKitFieldRow label="Heart Rate" field={hkMetrics.heartRateBpm} unit="BPM" now={now} isNew={hkNewDataFieldKeys.includes('heartRateBpm')} />
            <HealthKitFieldRow label="Resting Heart Rate" field={hkMetrics.restingHeartRateBpm} unit="BPM" now={now} isNew={hkNewDataFieldKeys.includes('restingHeartRateBpm')} />
            <HealthKitFieldRow label="Heart Rate Variability" field={hkMetrics.heartRateVariabilityMillis} unit="ms" now={now} isNew={hkNewDataFieldKeys.includes('heartRateVariabilityMillis')} />
            <HealthKitFieldRow label="Blood Oxygen (SpO2)" field={hkMetrics.spo2Percent} unit="%" now={now} isNew={hkNewDataFieldKeys.includes('spo2Percent')} />
            <HealthKitFieldRow label="Respiratory Rate" field={hkMetrics.respiratoryRate} unit="breaths/min" now={now} isNew={hkNewDataFieldKeys.includes('respiratoryRate')} />
            <HealthKitFieldRow label="Body Temperature" field={hkMetrics.bodyTemperatureCelsius} unit="°C" now={now} isNew={hkNewDataFieldKeys.includes('bodyTemperatureCelsius')} />
          </Section>

          <Section title="Sleep" defaultOpen>
            <HealthKitFieldRow
              label="Total Sleep"
              field={hkMetrics.sleep}
              format={(v) => formatMinutesAsHM((v as { totalMinutes: number }).totalMinutes)}
              now={now}
              isNew={hkNewDataFieldKeys.includes('sleep')}
            />
            {hkMetrics.sleep.status === 'available' && hkMetrics.sleep.value ? (
              <View style={{ marginTop: theme.spacing.xs }}>
                <AppText variant="caption" color="rgba(255,255,255,0.4)">
                  {new Date(hkMetrics.sleep.value.startTime).toLocaleString()} → {new Date(hkMetrics.sleep.value.endTime).toLocaleString()}
                </AppText>
                {hkMetrics.sleep.value.stages.map((stage) => (
                  <AppText key={stage.stage} variant="caption" color="rgba(255,255,255,0.4)">
                    {stage.stage}: {formatMinutesAsHM(stage.minutes)}
                  </AppText>
                ))}
              </View>
            ) : null}
          </Section>

          <Section title="Body" defaultOpen={false}>
            <HealthKitFieldRow label="Height" field={hkMetrics.heightCm} unit="cm" now={now} isNew={hkNewDataFieldKeys.includes('heightCm')} />
            <HealthKitFieldRow label="Weight" field={hkMetrics.weightKg} unit="kg" now={now} isNew={hkNewDataFieldKeys.includes('weightKg')} />
          </Section>

          <Section title="Developer / Apple Health Debug" defaultOpen={false}>
            <StatRow label="HealthKit available" value="Yes" />
            <StatRow label="Has requested permissions" value={hkHasRequestedPermissions ? 'Yes' : 'No'} />
            <AppText variant="caption" color="rgba(255,255,255,0.3)" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
              HealthKit deliberately never tells a read-only app whether a specific permission was granted or denied — "Unknown"
              below is the honest, expected answer for most read types, not a bug. The only way to know is whether data comes
              back.
            </AppText>

            <Section title="Per-Metric Authorization" defaultOpen>
              {REQUIRED_HK_METRIC_LABELS.map(([identifier, label]) => (
                <StatRow key={identifier} label={label} value={HK_AUTH_STATUS_COPY[hkAuthorizationStatuses[identifier] ?? 'unknown']} />
              ))}
            </Section>

            <Section title="Records (last 7 days)" defaultOpen={false}>
              {REQUIRED_HK_METRIC_LABELS.map(([identifier, label]) => {
                const count = hkDebugInfo.recordCounts[identifier] ?? 0;
                const records = hkDebugInfo.recentRecords[identifier] ?? [];
                return (
                  <View key={identifier} style={{ marginBottom: theme.spacing.sm }}>
                    <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                      {label} ({count})
                    </AppText>
                    {records.map((record, idx) => (
                      <View key={`${identifier}-${idx}`} style={{ paddingLeft: theme.spacing.sm, marginTop: 4 }}>
                        <AppText variant="caption" color="rgba(255,255,255,0.6)">
                          {record.summary}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          {record.startTime ? new Date(record.startTime).toLocaleString() : '—'}
                          {record.endTime && record.endTime !== record.startTime ? ` → ${new Date(record.endTime).toLocaleTimeString()}` : ''}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          Source: {formatHkSource(record.source)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                );
              })}
            </Section>

            <Section title="Data Pipeline Diagnostics (Temporary)" defaultOpen={false}>
              <AppText variant="caption" color="rgba(255,255,255,0.45)" style={{ marginBottom: theme.spacing.sm }}>
                Health Source → Apple Health / HealthKit → LongLivy. LongLivy has no direct visibility into the watch itself —
                only what HealthKit reports.
              </AppText>
              <AppButton label={isHkDeepRefreshing ? 'Running Deep Refresh…' : 'Deep Refresh'} onPress={handleHealthKitDeepRefresh} disabled={isHkDeepRefreshing} style={{ marginBottom: theme.spacing.sm }} />
              {hkDeepRefreshVerdict ? (
                <>
                  <HeroCard style={{ marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(122,151,176,0.35)' }}>
                    <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                      {hkDeepRefreshVerdict.headline}
                    </AppText>
                  </HeroCard>
                  {hkDeepRefreshVerdict.stages.map((stage) => (
                    <View key={stage.label} style={{ marginBottom: theme.spacing.sm }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
                          {stage.label}
                        </AppText>
                        <AppBadge label={PIPELINE_STAGE_STATUS_COPY[stage.status].label} tone={PIPELINE_STAGE_STATUS_COPY[stage.status].tone} />
                      </View>
                      <AppText variant="caption" color="rgba(255,255,255,0.4)">
                        {stage.detail}
                      </AppText>
                    </View>
                  ))}
                </>
              ) : null}
            </Section>
          </Section>
        </>
      ) : null}

      {Platform.OS === 'android' && hcStatus === 'ready' ? (
        <>
          <Section title="Activity" defaultOpen>
            <HealthConnectFieldRow label="Steps" field={hcMetrics.steps} now={now} isNew={hcNewDataFieldKeys.includes('steps')} />
            <HealthConnectFieldRow label="Distance" field={hcMetrics.distanceKm} unit="km" now={now} isNew={hcNewDataFieldKeys.includes('distanceKm')} />
            <HealthConnectFieldRow label="Exercise Sessions" field={hcMetrics.exerciseSessionCount} now={now} isNew={hcNewDataFieldKeys.includes('exerciseSessionCount')} />
            <HealthConnectFieldRow label="Total Calories Burned" field={hcMetrics.totalCaloriesKcal} unit="kcal" now={now} isNew={hcNewDataFieldKeys.includes('totalCaloriesKcal')} />
            <HealthConnectFieldRow label="Active Calories Burned" field={hcMetrics.activeCaloriesKcal} unit="kcal" now={now} isNew={hcNewDataFieldKeys.includes('activeCaloriesKcal')} />
          </Section>

          <Section title="Vitals" defaultOpen>
            <HealthConnectFieldRow label="Heart Rate" field={hcMetrics.heartRateBpm} unit="BPM" now={now} isNew={hcNewDataFieldKeys.includes('heartRateBpm')} />
            <HealthConnectFieldRow label="Resting Heart Rate" field={hcMetrics.restingHeartRateBpm} unit="BPM" now={now} isNew={hcNewDataFieldKeys.includes('restingHeartRateBpm')} />
            <HealthConnectFieldRow label="Heart Rate Variability" field={hcMetrics.heartRateVariabilityMillis} unit="ms" now={now} isNew={hcNewDataFieldKeys.includes('heartRateVariabilityMillis')} />
            <HealthConnectFieldRow label="Blood Oxygen (SpO2)" field={hcMetrics.spo2Percent} unit="%" now={now} isNew={hcNewDataFieldKeys.includes('spo2Percent')} />
            <HealthConnectFieldRow label="Respiratory Rate" field={hcMetrics.respiratoryRate} unit="breaths/min" now={now} isNew={hcNewDataFieldKeys.includes('respiratoryRate')} />
            <HealthConnectFieldRow label="Body Temperature" field={hcMetrics.bodyTemperatureCelsius} unit="°C" now={now} isNew={hcNewDataFieldKeys.includes('bodyTemperatureCelsius')} />
          </Section>

          <Section title="Sleep" defaultOpen>
            <HealthConnectFieldRow
              label="Total Sleep"
              field={hcMetrics.sleep}
              format={(v) => formatMinutesAsHM((v as { totalMinutes: number }).totalMinutes)}
              now={now}
              isNew={hcNewDataFieldKeys.includes('sleep')}
            />
            {hcMetrics.sleep.status === 'available' && hcMetrics.sleep.value ? (
              <View style={{ marginTop: theme.spacing.xs }}>
                <AppText variant="caption" color="rgba(255,255,255,0.4)">
                  {new Date(hcMetrics.sleep.value.startTime).toLocaleString()} → {new Date(hcMetrics.sleep.value.endTime).toLocaleString()}
                </AppText>
                {hcMetrics.sleep.value.stages.map((stage) => (
                  <AppText key={stage.stage} variant="caption" color="rgba(255,255,255,0.4)">
                    {stage.stage}: {formatMinutesAsHM(stage.minutes)}
                  </AppText>
                ))}
              </View>
            ) : null}
          </Section>

          <Section title="Body & Nutrition" defaultOpen={false}>
            <HealthConnectFieldRow label="Height" field={hcMetrics.heightCm} unit="cm" now={now} isNew={hcNewDataFieldKeys.includes('heightCm')} />
            <HealthConnectFieldRow label="Weight" field={hcMetrics.weightKg} unit="kg" now={now} isNew={hcNewDataFieldKeys.includes('weightKg')} />
            <HealthConnectFieldRow label="Hydration (today)" field={hcMetrics.hydrationLiters} unit="L" now={now} isNew={hcNewDataFieldKeys.includes('hydrationLiters')} />
          </Section>

          <Section title="Developer / Health Connect Debug" defaultOpen={false}>
            <StatRow label="Availability" value={HC_STATUS_COPY[hcStatus].label} />
            <StatRow label="All permissions granted" value={hcHasAllPermissions ? 'Yes' : 'No'} />

            <Section title="Data Pipeline Status" defaultOpen>
              <AppText variant="caption" color="rgba(255,255,255,0.45)" style={{ marginBottom: theme.spacing.sm }}>
                Noise Brio → NoiseFit → Google Fit → Health Connect → LongLivy. Each stage below reflects what LongLivy can
                actually observe — never a guess about a layer it can't see into.
              </AppText>
              <StatRow label="Noise Watch (BLE)" value={isConnected ? 'Connected' : 'Not Connected'} />
              <StatRow label="NoiseFit" value="Not directly accessible — external app" />
              <StatRow label="Google Fit" value={pipelineSummary.lastGoogleFitRecordAt ? 'Data flowing' : 'Unknown'} />
              <StatRow label="Health Connect" value={hcStatus === 'ready' ? 'Connected ✓' : HC_STATUS_COPY[hcStatus].label} />
              <StatRow label="LongLivy" value={hcStatus === 'ready' ? 'Reading Health Connect ✓' : 'Waiting'} />
              <View style={{ marginTop: theme.spacing.sm }}>
                <StatRow
                  label="Last known NoiseFit-derived record"
                  value={pipelineSummary.lastNoiseFitRecordAt ? new Date(pipelineSummary.lastNoiseFitRecordAt).toLocaleString() : 'Not Available'}
                />
                <StatRow label="Last Health Connect record" value={hcLastDataReceivedAt ? new Date(hcLastDataReceivedAt).toLocaleString() : 'Not Available'} />
                <StatRow label="Last LongLivy read" value={hcLastCheckedAt ? new Date(hcLastCheckedAt).toLocaleString() : 'Not Available'} />
              </View>
              <AppText variant="caption" color="rgba(255,255,255,0.3)" style={{ marginTop: theme.spacing.sm }}>
                There is no supported API to make NoiseFit or Google Fit sync on demand — LongLivy can only re-check what's
                already in Health Connect (see Refresh Health Data above) or hand off to NoiseFit directly (Open NoiseFit).
              </AppText>
            </Section>

            {/* Confirmed on-device: Fit has full read/write permission in Health Connect and the
                bridge does deliver new data — with an observed ~15-45 minute lag (consistent with
                Android's WorkManager minimum periodic-work interval), not a broken connection. */}
            <Section title="Google Fit / Health Connect Bridge" defaultOpen>
              <StatRow label="Connection" value={freshestGoogleFitRecord ? 'Connected' : 'No Fit-attributed data seen'} />
              <View style={{ marginTop: theme.spacing.sm }}>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  Last known Google Fit-derived record in Health Connect
                </AppText>
                <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                  {freshestGoogleFitRecord ? `${freshestGoogleFitRecord.recordType}: ${freshestGoogleFitRecord.summary}` : 'Not Available'}
                </AppText>
                {freshestGoogleFitRecord ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.4)">
                    {new Date(freshestGoogleFitRecord.time).toLocaleString()} · {formatAge(freshestGoogleFitRecord.time, now)}
                  </AppText>
                ) : null}
              </View>
              <View style={{ marginTop: theme.spacing.sm }}>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  Latest Health Connect record (any source)
                </AppText>
                <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                  {freshestOverallRecord ? `${freshestOverallRecord.recordType}: ${freshestOverallRecord.summary}` : 'Not Available'}
                </AppText>
                {freshestOverallRecord ? (
                  <AppText variant="caption" color="rgba(255,255,255,0.4)">
                    {new Date(freshestOverallRecord.time).toLocaleString()} · {formatAge(freshestOverallRecord.time, now)} · {formatHcSource(freshestOverallRecord.source)}
                  </AppText>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm }}>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  Bridge status
                </AppText>
                <AppBadge label={FIT_BRIDGE_STATUS_COPY[fitBridgeStatus].label} tone={FIT_BRIDGE_STATUS_COPY[fitBridgeStatus].tone} />
              </View>
              <AppText variant="caption" color="rgba(255,255,255,0.3)" style={{ marginTop: theme.spacing.xs }}>
                Confirmed on this device: Health Connect's own "Data and access" settings show Fit has full read/write
                permission and Fit-sourced Heart Rate entries do arrive, roughly every 15-45 minutes — this is normal platform
                latency, not a broken connection. "Delayed" here means exactly that: give it more time rather than assuming
                something is misconfigured.
              </AppText>
            </Section>

            <Section title="Per-Metric Permissions" defaultOpen>
              {REQUIRED_HC_METRIC_LABELS.map(([recordType, label]) => (
                <StatRow key={recordType} label={label} value={hcGrantedRecordTypes.includes(recordType) ? '✓ Granted' : '✗ Missing'} />
              ))}
            </Section>
            <Section title="Records (last 7 days)" defaultOpen={false}>
              {REQUIRED_HC_METRIC_LABELS.map(([recordType, label]) => {
                const count = hcDebugInfo.recordCounts[recordType] ?? 0;
                const records = hcDebugInfo.recentRecords[recordType] ?? [];
                return (
                  <View key={recordType} style={{ marginBottom: theme.spacing.sm }}>
                    <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                      {label} ({count})
                    </AppText>
                    {records.map((record, idx) => (
                      <View key={`${recordType}-${idx}`} style={{ paddingLeft: theme.spacing.sm, marginTop: 4 }}>
                        <AppText variant="caption" color="rgba(255,255,255,0.6)">
                          {record.summary}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          {record.startTime ? new Date(record.startTime).toLocaleString() : '—'}
                          {record.endTime && record.endTime !== record.startTime ? ` → ${new Date(record.endTime).toLocaleString()}` : ''}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          Source: {formatHcSource(record.source)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                );
              })}
            </Section>
            <AppButton label="Open Health Connect Settings" onPress={handleOpenHealthConnectSettings} variant="outline" style={{ marginTop: theme.spacing.sm }} />
          </Section>

          {/* TEMPORARY — see healthConnectDiagnostics.ts. Local-only diagnostic, not part of the
              production Redux state, meant to pinpoint exactly which pipeline stage a new NoiseFit
              measurement is stuck at. Safe to remove once the freshness delay is understood. */}
          <Section title="Data Pipeline Diagnostics (Temporary)" defaultOpen={false}>
            <AppText variant="caption" color="rgba(255,255,255,0.45)" style={{ marginBottom: theme.spacing.sm }}>
              LongLivy cannot query NoiseFit or Google Fit directly (no supported non-deprecated API exists). Every "Google
              Fit" row below is really "the newest Health Connect record attributed to Google Fit" — if Health Connect hasn't
              advanced, open Google Fit's own app to see whether it already has the new reading.
            </AppText>
            <AppButton label={isDeepRefreshing ? 'Running Deep Refresh…' : 'Deep Refresh'} onPress={handleDeepRefresh} disabled={isDeepRefreshing} style={{ marginBottom: theme.spacing.sm }} />

            {pipelineVerdict ? (
              <>
                <HeroCard style={{ marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: 'rgba(122,151,176,0.35)' }}>
                  <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                    {pipelineVerdict.headline}
                  </AppText>
                </HeroCard>

                {pipelineVerdict.stages.map((stage) => (
                  <View key={stage.label} style={{ marginBottom: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
                        {stage.label}
                      </AppText>
                      <AppBadge label={PIPELINE_STAGE_STATUS_COPY[stage.status].label} tone={PIPELINE_STAGE_STATUS_COPY[stage.status].tone} />
                    </View>
                    <AppText variant="caption" color="rgba(255,255,255,0.4)">
                      {stage.detail}
                    </AppText>
                  </View>
                ))}
              </>
            ) : null}

            {deepRefreshResult ? (
              <>
                <Section title="Heart Rate — Recent Samples" defaultOpen={false}>
                  {deepRefreshResult.heartRate.samples.length === 0 ? (
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.45)">
                      No HeartRate samples in the last 48h.
                    </AppText>
                  ) : (
                    deepRefreshResult.heartRate.samples.map((sample, idx) => (
                      <View key={idx} style={{ marginBottom: theme.spacing.sm }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                            {sample.value} BPM
                          </AppText>
                          <AppText variant="caption" color="rgba(255,255,255,0.5)">
                            {formatAge(sample.sampleTime, now)}
                          </AppText>
                        </View>
                        <AppText variant="caption" color="rgba(255,255,255,0.45)">
                          Sample: {new Date(sample.sampleTime).toLocaleString()}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          Parent record: {new Date(sample.parentRecordStartTime).toLocaleTimeString()} → {new Date(sample.parentRecordEndTime).toLocaleTimeString()}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          Source: {formatHcSource(sample.source)}
                        </AppText>
                      </View>
                    ))
                  )}
                </Section>

                <Section title="Steps — Individual Records" defaultOpen={false}>
                  <StatRow label="Today's aggregate total" value={deepRefreshResult.steps.aggregateTotal !== null ? String(deepRefreshResult.steps.aggregateTotal) : 'Not Available'} />
                  <StatRow label="Aggregate source count" value={String(deepRefreshResult.steps.aggregateSourceCount)} />
                  {deepRefreshResult.steps.individualRecords.length === 0 ? (
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.45)" style={{ marginTop: theme.spacing.sm }}>
                      No individual Steps records in the last 24h.
                    </AppText>
                  ) : (
                    deepRefreshResult.steps.individualRecords.map((record, idx) => (
                      <View key={idx} style={{ marginTop: theme.spacing.sm }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                            {record.count} steps
                          </AppText>
                          <AppText variant="caption" color="rgba(255,255,255,0.5)">
                            {formatAge(record.startTime, now)}
                          </AppText>
                        </View>
                        <AppText variant="caption" color="rgba(255,255,255,0.45)">
                          {new Date(record.startTime).toLocaleString()} → {new Date(record.endTime).toLocaleTimeString()}
                        </AppText>
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          Source: {formatHcSource(record.source)}
                        </AppText>
                      </View>
                    ))
                  )}
                </Section>

                <Section title="Changes Since Last Deep Refresh" defaultOpen={false}>
                  {!deepRefreshResult.changes.supported ? (
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.45)">
                      Not supported on this Health Connect version{deepRefreshResult.changes.error ? `: ${deepRefreshResult.changes.error}` : '.'}
                    </AppText>
                  ) : deepRefreshResult.changes.isBaseline ? (
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                      Baseline established. Run Deep Refresh again to see what changed since now.
                      {deepRefreshResult.changes.error ? ` (${deepRefreshResult.changes.error})` : ''}
                    </AppText>
                  ) : (
                    <>
                      <StatRow label="Changed records" value={String(deepRefreshResult.changes.changeCount)} />
                      {deepRefreshResult.changes.latestChangeSummaries.map((summary, idx) => (
                        <AppText key={idx} variant="caption" color="rgba(255,255,255,0.45)" style={{ marginTop: 4 }}>
                          {summary}
                        </AppText>
                      ))}
                    </>
                  )}
                </Section>
              </>
            ) : null}
          </Section>
        </>
      ) : null}

      {connectionState === 'bluetooth_unavailable' ? (
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
          This device/simulator doesn't support Bluetooth Low Energy, or Bluetooth is turned off. BLE requires a physical
          phone with Bluetooth enabled.
        </AppText>
      ) : connectionState === 'permission_denied' ? (
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
          Bluetooth permission was denied. Enable it for Longlivy in your device's system settings, then try again.
        </AppText>
      ) : null}

      {isConnected ? (
        <AppButton label="Disconnect" onPress={handleDisconnect} variant="outline" style={{ marginBottom: theme.spacing.md }} />
      ) : isReconnecting ? (
        <AppButton label="Reconnecting…" onPress={() => {}} disabled variant="outline" style={{ marginBottom: theme.spacing.md }} />
      ) : (
        <>
          {lastKnownDeviceId && connectionState !== 'scanning' ? (
            <AppButton label="Reconnect" onPress={handleReconnect} style={{ marginBottom: theme.spacing.sm }} />
          ) : null}
          <AppButton
            label={connectionState === 'scanning' ? 'Stop Scanning' : 'Scan for Devices'}
            onPress={handleScanPress}
            disabled={!canScan}
            variant={connectionState === 'scanning' || lastKnownDeviceId ? 'outline' : 'primary'}
            style={{ marginBottom: theme.spacing.md }}
          />
        </>
      )}

      {!isConnected && !isReconnecting && devices.length > 0 ? (
        <View style={{ marginBottom: theme.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <AppText variant="headingSmall" color="#FFFFFF">
              Nearby Devices ({sortedDevices.length})
            </AppText>
            <View style={{ flexDirection: 'row' }}>
              <FilterChip label="All" active={deviceFilter === 'all'} onPress={() => setDeviceFilter('all')} />
              <FilterChip label="Noise" active={deviceFilter === 'noise'} onPress={() => setDeviceFilter('noise')} />
            </View>
          </View>

          {noiseMatches.length > 0 ? (
            <>
              <AppText variant="bodySmall" color="rgba(150,255,190,0.85)" style={{ marginBottom: theme.spacing.xs }}>
                ⭐ Possible Noise Watch
              </AppText>
              {noiseMatches.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  connectionState={connectionState}
                  connectedOrConnectingId={connectedOrConnectingDeviceId}
                  expanded={expandedDeviceId === device.id}
                  onToggleDetails={() => setExpandedDeviceId((id) => (id === device.id ? null : device.id))}
                  onConnect={() => handleDevicePress(device)}
                />
              ))}
            </>
          ) : null}

          {otherDevices.length > 0 ? (
            <>
              {noiseMatches.length > 0 ? (
                <AppText variant="bodySmall" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs }}>
                  Other Nearby Devices
                </AppText>
              ) : null}
              {otherDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  connectionState={connectionState}
                  connectedOrConnectingId={connectedOrConnectingDeviceId}
                  expanded={expandedDeviceId === device.id}
                  onToggleDetails={() => setExpandedDeviceId((id) => (id === device.id ? null : device.id))}
                  onConnect={() => handleDevicePress(device)}
                />
              ))}
            </>
          ) : null}
        </View>
      ) : null}

      {isConnected ? (
        <>
          {/* Synchronization */}
          <HeroCard style={{ marginBottom: theme.spacing.md }}>
            <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.sm }}>
              Synchronization
            </AppText>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Sync
              </AppText>
              <AppBadge label={syncStatusCopy.label} tone={syncStatusCopy.tone} />
            </View>
            {lastSyncedAt ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                  Last Sync
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.8)">
                  {new Date(lastSyncedAt).toLocaleTimeString()}
                </AppText>
              </View>
            ) : null}
            {syncStatus === 'error' && syncError ? (
              <AppText variant="caption" color="rgba(255,120,120,0.85)" style={{ marginBottom: theme.spacing.sm }}>
                {syncError === 'connection_lost' ? 'Connection lost — sync incomplete.' : syncError}
              </AppText>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: theme.spacing.sm }}>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                Auto Sync
              </AppText>
              <AppSwitch value={autoSyncEnabled} onValueChange={handleAutoSyncToggle} variant="hero" accessibilityLabel="Auto sync" />
            </View>

            <AppButton
              label={syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'error' ? 'Retry Sync' : 'Sync Now'}
              onPress={handleSyncNow}
              disabled={syncStatus === 'syncing'}
              style={{ marginTop: theme.spacing.sm }}
            />
            <AppText variant="caption" color="rgba(255,255,255,0.35)" style={{ marginTop: theme.spacing.xs }}>
              Re-reads every readable characteristic directly from the watch. Fields that only update via notifications
              already stream live on their own — Sync Now doesn't need to (and can't reliably) request a fresh
              measurement, since that would require a proprietary command this app hasn't verified.
            </AppText>
          </HeroCard>

          {/* Activity */}
          <Section title="Activity" defaultOpen>
            {[...activityPriorityFields, ...workoutFields].map(([label, field]) => (
              <FieldRow
                key={label}
                label={label}
                field={field}
                now={now}
                isSyncing={isSyncing}
                hasStandardSource={deviceHasStandardService(services, label)}
                unit={label === 'Calories' ? 'kcal' : undefined}
                format={label === 'Distance' ? (v) => `${(Number(v) / 1000).toFixed(2)} km` : undefined}
              />
            ))}
          </Section>

          {/* Health */}
          <Section title="Health" defaultOpen>
            {healthFields.map(([label, field]) => (
              <FieldRow
                key={label}
                label={label}
                field={field}
                now={now}
                isSyncing={isSyncing}
                hasStandardSource={deviceHasStandardService(services, label)}
                unit={label === 'Heart Rate' ? 'BPM' : label === 'Blood O₂' ? '%' : undefined}
              />
            ))}
          </Section>

          {/* Sleep */}
          <Section title="Sleep" defaultOpen>
            {sleepFields.map(([label, field]) => (
              <FieldRow
                key={label}
                label={label}
                field={field}
                now={now}
                isSyncing={isSyncing}
                hasStandardSource={false}
                format={(v) => formatMinutesAsHM(Number(v))}
              />
            ))}
          </Section>

          {/* Developer / BLE Debug */}
          <Section title="Developer / BLE Debug" defaultOpen={false}>
            {/* BLE Live Data summary */}
            <Section title="BLE Live Data" defaultOpen>
              <StatRow label="Connected" value={connectedDeviceName ?? '—'} />
              <StatRow label="Services" value={String(services.length)} />
              <StatRow label="Characteristics" value={String(allCharacteristics.length)} />
              <StatRow label="Notifications active" value={String(notifiableCount)} />
              <StatRow label="Packets received" value={totalPacketsReceived.toLocaleString()} />
            </Section>

            {/* Live Packet Console */}
            <Section title={`Live Packet Console (${rawLog.length})`} defaultOpen>
              {rawLog.length === 0 ? (
                <AppText variant="bodySmall" color="rgba(255,255,255,0.45)">
                  No packets yet — waiting on reads/notifications.
                </AppText>
              ) : (
                rawLog.map((entry, index) => (
                  <HeroCard key={`${entry.timestamp}-${index}`} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.xs }}>
                    <AppText variant="caption" color="rgba(255,255,255,0.5)">
                      {new Date(entry.timestamp).toLocaleTimeString()} · CHARACTERISTIC {entry.characteristicUUID.slice(0, 8)} · {entry.type === 'notification' ? 'NOTIFY' : 'READ'}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.65)" style={{ marginTop: 2 }}>
                      HEX: {entry.hex}
                    </AppText>
                    <AppText variant="caption" color={entry.parsedAs ? 'rgba(150,255,190,0.85)' : 'rgba(255,255,255,0.4)'} style={{ marginTop: 2 }}>
                      Parsed: {entry.parsedAs ?? 'Unknown vendor packet'}
                    </AppText>
                  </HeroCard>
                ))
              )}
            </Section>

            {/* Ground Truth Analyzer */}
            <Section title="Ground Truth Analyzer" defaultOpen>
              <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginBottom: theme.spacing.sm }}>
                Capture a snapshot of every characteristic's latest value, do something on the watch, capture again, and enter what
                actually changed on the watch face — this diffs the two snapshots byte-by-byte. Nothing here is written to the
                watch, and no result is ever assumed correct.
              </AppText>
              <HeroTextField label="Metric" value={gtMetricName} onChangeText={setGtMetricName} placeholder="e.g. Steps" />
              <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
                <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
                  <HeroTextField label="Before" value={gtBeforeValue} onChangeText={setGtBeforeValue} placeholder="0" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <HeroTextField label="After" value={gtAfterValue} onChangeText={setGtAfterValue} placeholder="0" keyboardType="numeric" />
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
                <AppButton label="Capture Baseline" onPress={handleCaptureBaseline} variant="outline" style={{ flex: 1, marginRight: theme.spacing.sm }} />
                <AppButton label="Capture After" onPress={handleCaptureAfter} variant="outline" disabled={!gtBaseline} style={{ flex: 1 }} />
              </View>
              {gtBaseline ? (
                <AppText variant="caption" color="rgba(150,255,190,0.85)" style={{ marginTop: theme.spacing.xs }}>
                  ✓ Baseline captured ({gtBaseline.length} characteristics with data)
                </AppText>
              ) : null}
              {gtAfterSnapshot ? (
                <AppText variant="caption" color="rgba(150,255,190,0.85)">
                  ✓ After-snapshot captured ({gtAfterSnapshot.length} characteristics with data)
                </AppText>
              ) : null}
              <AppButton
                label="Analyze Changes"
                onPress={handleAnalyzeGroundTruth}
                disabled={!gtBaseline || !gtAfterSnapshot || gtBeforeValue === '' || gtAfterValue === ''}
                style={{ marginTop: theme.spacing.sm }}
              />
              {gtBaseline || gtAfterSnapshot ? (
                <Pressable onPress={handleResetGroundTruth} accessibilityRole="button" style={{ marginTop: theme.spacing.xs, alignSelf: 'center' }}>
                  <AppText variant="caption" color="rgba(255,255,255,0.4)">
                    Reset
                  </AppText>
                </Pressable>
              ) : null}

              {gtResults ? (
                gtResults.length === 0 ? (
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.45)" style={{ marginTop: theme.spacing.sm }}>
                    No bytes changed between the two snapshots.
                  </AppText>
                ) : (
                  <View style={{ marginTop: theme.spacing.sm }}>
                    <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginBottom: theme.spacing.xs }}>
                      Target delta ({gtMetricName || 'metric'}): {Number(gtAfterValue) - Number(gtBeforeValue)} · {gtResults.length} byte(s) changed
                    </AppText>
                    {gtResults.map((c, idx) => (
                      <HeroCard
                        key={`${c.characteristicUUID}-${c.offset}-${idx}`}
                        style={{ marginBottom: theme.spacing.xs, borderWidth: c.matchesTarget ? 1.5 : 0, borderColor: c.matchesTarget ? 'rgba(150,255,190,0.5)' : 'transparent' }}
                      >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                          <AppText variant="caption" weight="600" color="#FFFFFF">
                            {c.characteristicUUID.slice(0, 8)} · offset {c.offset}
                          </AppText>
                          <AppBadge label="Potential field — NOT VERIFIED" tone={c.matchesTarget ? 'success' : 'neutral'} />
                        </View>
                        <AppText variant="caption" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }}>
                          0x{c.beforeByte.toString(16).padStart(2, '0')} ({c.beforeByte}) → 0x{c.afterByte.toString(16).padStart(2, '0')} ({c.afterByte}) · change {c.delta >= 0 ? '+' : ''}
                          {c.delta}
                        </AppText>
                      </HeroCard>
                    ))}
                  </View>
                )
              ) : null}
            </Section>

            <Section title="Device Information" defaultOpen={false}>
              {[...minimalDeviceFields, ...debugDeviceFields].map(([label, field]) => (
                <FieldRow key={label} label={label} field={field} now={now} isSyncing={isSyncing} hasStandardSource={deviceHasStandardService(services, label)} />
              ))}
            </Section>

            <Section title="Battery" defaultOpen={false}>
              {batteryFields.map(([label, field]) => (
                <FieldRow key={label} label={label} field={field} now={now} isSyncing={isSyncing} hasStandardSource={deviceHasStandardService(services, label)} />
              ))}
            </Section>

            <Section title="Extended / Derived Metrics" defaultOpen={false}>
              {extendedMetricFields.map(([label, field]) => (
                <FieldRow key={label} label={label} field={field} now={now} isSyncing={isSyncing} hasStandardSource={deviceHasStandardService(services, label)} />
              ))}
            </Section>

            <Section title={`Data Availability (${allFields.length})`} defaultOpen={false}>
              {allFields.map(([label, field]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xxs }}>
                  <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ flex: 1 }}>
                    {label}
                  </AppText>
                  <AppBadge label={FIELD_STATUS_COPY[field.status].label} tone={FIELD_STATUS_COPY[field.status].tone} />
                  <AppText variant="caption" color="rgba(255,255,255,0.35)" style={{ width: 90, textAlign: 'right' }} numberOfLines={1}>
                    {field.characteristicUUID ? field.characteristicUUID.slice(0, 8) : '—'}
                  </AppText>
                </View>
              ))}
            </Section>

            <Section title={`Live Metrics (${liveFields.length})`} defaultOpen={false}>
              {liveFields.length === 0 ? (
                <AppText variant="bodySmall" color="rgba(255,255,255,0.45)">
                  No real-time notifications received yet.
                </AppText>
              ) : (
                liveFields.map(([label, field]) => (
                  <View key={label} style={{ marginBottom: theme.spacing.sm }}>
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.55)">
                      {label}
                    </AppText>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <AppText variant="headingSmall" weight="700" color="#FFFFFF">
                        {formatValue(field)}
                      </AppText>
                      <AppText variant="caption" color="rgba(255,255,255,0.4)">
                        Updated <TimeAgo iso={field.lastUpdatedAt} now={now} />
                      </AppText>
                    </View>
                  </View>
                ))
              )}
            </Section>

            <Section title={`BLE Services (${services.length})`} defaultOpen={false}>
              {services.map((service) => (
                <View key={service.uuid} style={{ marginBottom: theme.spacing.md }}>
                  <AppText variant="bodySmall" weight="600" color="#FFFFFF" style={{ marginBottom: 4 }}>
                    {service.uuid}
                  </AppText>
                  {service.characteristics.map((c) => {
                    const stats = packetStats.find((p) => p.characteristicUUID === c.uuid);
                    const vendorLabel = knownVendorChannelLabel(c.uuid);
                    return (
                      <View key={c.uuid} style={{ marginBottom: theme.spacing.xs, paddingLeft: theme.spacing.sm }}>
                        <AppText variant="caption" color="rgba(255,255,255,0.55)">
                          {c.uuid}
                        </AppText>
                        {vendorLabel ? (
                          <AppText variant="caption" color="rgba(122,151,176,0.85)">
                            {vendorLabel}
                          </AppText>
                        ) : null}
                        <AppText variant="caption" color="rgba(255,255,255,0.4)">
                          {[c.isReadable && 'read', c.isNotifiable && 'notify', c.isIndicatable && 'indicate', c.isWritableWithResponse && 'write']
                            .filter(Boolean)
                            .join(', ') || 'no properties'}
                          {stats ? ` · ${stats.totalPackets} packets · last ` : ''}
                          {stats ? <TimeAgo iso={stats.lastPacketAt} now={now} /> : null}
                        </AppText>
                      </View>
                    );
                  })}
                </View>
              ))}
            </Section>

            <Section title={`Vendor Characteristics (${unknownStats.length})`} defaultOpen={false}>
              {unknownStats.length === 0 ? (
                <AppText variant="bodySmall" color="rgba(255,255,255,0.45)">
                  Every characteristic that has sent data so far was recognized.
                </AppText>
              ) : (
                unknownStats.map((stat) => (
                  <HeroCard key={stat.characteristicUUID} style={{ marginBottom: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <AppText variant="bodySmall" weight="600" color="#FFFFFF">
                        {stat.characteristicUUID}
                      </AppText>
                      {knownVendorChannelLabel(stat.characteristicUUID) ? <AppBadge label="Verified channel" tone="info" /> : null}
                    </View>
                    {knownVendorChannelLabel(stat.characteristicUUID) ? (
                      <AppText variant="caption" color="rgba(122,151,176,0.85)" style={{ marginTop: 2 }}>
                        {knownVendorChannelLabel(stat.characteristicUUID)}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" color="rgba(255,255,255,0.45)">
                      Service: {stat.serviceUUID}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.45)">
                      {stat.isNotify ? 'Notification' : 'Read'} · {stat.totalPackets} packets · {stat.payloadSizeBytes} bytes
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.45)">
                      First seen <TimeAgo iso={stat.firstPacketAt} now={now} /> · Last updated <TimeAgo iso={stat.lastPacketAt} now={now} /> · Change frequency: {formatChangeFrequency(stat.packetsPerSecond)}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.65)" style={{ marginTop: 4 }}>
                      {stat.lastHex}
                    </AppText>
                    <AppText variant="caption" color="rgba(255,255,255,0.4)">
                      [{stat.lastDecimalBytes.join(', ')}]
                    </AppText>
                  </HeroCard>
                ))
              )}
            </Section>
          </Section>
        </>
      ) : null}
    </TabHeroLayout>
  );
};

const StatRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.xxs }}>
      <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
        {label}
      </AppText>
      <AppText variant="bodySmall" weight="600" color="#FFFFFF">
        {value}
      </AppText>
    </View>
  );
};

const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
        marginLeft: theme.spacing.xs,
        backgroundColor: active ? 'rgba(92,122,148,0.25)' : 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: active ? 'rgba(92,122,148,0.6)' : 'rgba(255,255,255,0.14)',
      }}
    >
      <AppText variant="caption" color={active ? '#7A97B0' : 'rgba(255,255,255,0.6)'}>
        {label}
      </AppText>
    </Pressable>
  );
};

const DeviceCard: React.FC<{
  device: NoiseDiscoveredDevice;
  connectionState: NoiseConnectionState;
  connectedOrConnectingId: string | null;
  expanded: boolean;
  onToggleDetails: () => void;
  onConnect: () => void;
}> = ({ device, connectionState, connectedOrConnectingId, expanded, onToggleDetails, onConnect }) => {
  const { theme } = useTheme();
  const displayName = getDeviceDisplayName(device);
  const isThisDeviceBusy = connectedOrConnectingId === device.id && connectionState === 'connecting';
  // Prevents firing a second connect at this specific row while a connect
  // to ANY device is already in flight — the thunk itself also guards this,
  // this just keeps the button from looking tappable in the meantime.
  const connectDisabled = connectionState === 'connecting';

  return (
    <HeroCard style={{ marginBottom: theme.spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <AppText variant="bodyLarge" weight="700" color="#FFFFFF">
              {displayName}
            </AppText>
            {device.isLikelySuggestedMatch ? <AppBadge label="Possible Noise Watch" tone="success" /> : null}
          </View>
          <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: 2 }}>
            Signal: {device.rssi ?? '—'} dBm
          </AppText>
          <AppText variant="caption" color="rgba(255,255,255,0.45)" numberOfLines={1}>
            Device ID: {device.id}
          </AppText>
          {device.timesSeen > 1 ? (
            <AppText variant="caption" color="rgba(255,255,255,0.35)">
              Seen {device.timesSeen}× · last seen just now
            </AppText>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', marginTop: theme.spacing.sm }}>
        <AppButton
          label={isThisDeviceBusy ? 'Connecting…' : 'Connect'}
          onPress={onConnect}
          disabled={connectDisabled}
          fullWidth={false}
          style={{ marginRight: theme.spacing.sm, paddingHorizontal: theme.spacing.lg }}
        />
        <Pressable
          onPress={onToggleDetails}
          accessibilityRole="button"
          accessibilityLabel="Device details"
          style={{
            paddingHorizontal: theme.spacing.md,
            height: theme.componentSizes.buttonHeight,
            borderRadius: theme.radius.md,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
        >
          <AppText variant="label" color="#FFFFFF">
            Details
          </AppText>
          <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color="rgba(255,255,255,0.6)" />
        </Pressable>
      </View>

      {expanded ? (
        <View style={{ marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
          <DetailRow label="Name" value={device.name} />
          <DetailRow label="Local Name" value={device.localName} />
          <DetailRow label="Device ID" value={device.id} />
          <DetailRow label="RSSI" value={device.rssi !== null ? `${device.rssi} dBm` : null} />
          <DetailRow label="TX Power" value={device.txPowerLevel !== null ? String(device.txPowerLevel) : null} />
          <DetailRow label="Connectable" value={device.isConnectable === null ? null : device.isConnectable ? 'Yes' : 'No'} />
          <DetailRow label="Manufacturer Data" value={device.manufacturerDataBase64 ? base64ToHex(device.manufacturerDataBase64) : null} />
          <DetailRow label="Service UUIDs" value={device.serviceUUIDs && device.serviceUUIDs.length > 0 ? device.serviceUUIDs.join('\n') : null} />
          <DetailRow
            label="Service Data"
            value={device.serviceData && Object.keys(device.serviceData).length > 0 ? Object.entries(device.serviceData).map(([uuid, b64]) => `${uuid}: ${base64ToHex(b64)}`).join('\n') : null}
          />
          <DetailRow label="Advertisement Data" value={device.rawScanRecordBase64 ? base64ToHex(device.rawScanRecordBase64) : null} />
        </View>
      ) : null}
    </HeroCard>
  );
};

const DetailRow: React.FC<{ label: string; value: string | null }> = ({ label, value }) => {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.xs }}>
      <AppText variant="caption" color="rgba(255,255,255,0.4)">
        {label}
      </AppText>
      <AppText variant="caption" color={value ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'}>
        {value ?? '(not advertised)'}
      </AppText>
    </View>
  );
};

const Section: React.FC<{ title: string; defaultOpen: boolean; children: React.ReactNode }> = ({ title, defaultOpen, children }) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <HeroCard style={{ marginBottom: theme.spacing.md }}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityLabel={title}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="headingSmall" color="#FFFFFF">
            {title}
          </AppText>
          <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.5)" />
        </View>
      </Pressable>
      {open ? <View style={{ marginTop: theme.spacing.sm }}>{children}</View> : null}
    </HeroCard>
  );
};

const FieldRow: React.FC<{
  label: string;
  field: NoiseField<unknown>;
  now: number;
  /** True only while a Sync Now / auto-sync read cycle is in flight — an unpopulated field shows "Syncing…" instead of "Not Available" for the duration, since this app is actively trying it right now. */
  isSyncing?: boolean;
  /** Whether the currently connected watch actually exposed the Bluetooth-standard service this field would need — computed per-device (see deviceHasStandardService), not assumed. Only affects the "why is this Not Available" hint. */
  hasStandardSource?: boolean;
  unit?: string;
  format?: (value: unknown) => string;
}> = ({ label, field, now, isSyncing, hasStandardSource, unit, format }) => {
  const { theme } = useTheme();
  const isPopulated = field.status === 'available' || field.status === 'available_zero';
  const isStale = isPopulated && field.isRealtime && field.lastUpdatedAt !== null && now - new Date(field.lastUpdatedAt).getTime() > LIVE_THRESHOLD_MS;
  const displayValue = isPopulated ? (format ? format(field.value) : `${formatValue(field)}${unit ? ` ${unit}` : ''}`) : null;

  return (
    <View style={{ marginBottom: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
          {label}
        </AppText>
        {isPopulated ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {field.isRealtime ? (
              <AppText variant="caption" color={isStale ? 'rgba(255,190,120,0.9)' : 'rgba(150,255,190,0.9)'} style={{ marginRight: 6 }}>
                {isStale ? 'Stale' : '● Live'}
              </AppText>
            ) : null}
            <AppText variant="bodySmall" weight="600" color="#FFFFFF">
              {displayValue}
            </AppText>
          </View>
        ) : field.status === 'not_available' && isSyncing ? (
          <AppText variant="bodySmall" color="rgba(122,151,176,0.85)">
            Syncing…
          </AppText>
        ) : (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.35)">
            {FIELD_STATUS_COPY[field.status].label}
          </AppText>
        )}
      </View>
      {field.lastUpdatedAt ? (
        <AppText variant="caption" color="rgba(255,255,255,0.35)">
          {field.characteristicUUID ? `${field.characteristicUUID.slice(0, 8)} · ` : ''}
          updated <TimeAgo iso={field.lastUpdatedAt} now={now} />
        </AppText>
      ) : field.status === 'not_available' && !isSyncing ? (
        <AppText variant="caption" color="rgba(255,255,255,0.3)">
          {hasStandardSource
            ? 'Standard characteristic exists but this watch hasn\'t sent a value yet — try Sync Now'
            : 'This watch has no Bluetooth-standard characteristic for this metric — see Developer / BLE Debug for undecoded vendor data'}
        </AppText>
      ) : null}
    </View>
  );
};

/** Reads whatever Health Connect's own metadata says — never assumes "NoiseFit". */
function formatHcSource(source: HealthConnectSource | 'unknown' | null): string {
  if (source === null) return '';
  if (source === 'unknown') return 'Source Unknown';
  return [source.packageName, source.deviceType].filter(Boolean).join(' · ');
}

const HealthConnectFieldRow: React.FC<{
  label: string;
  field: HealthConnectField<unknown>;
  unit?: string;
  format?: (value: unknown) => string;
  /** Wall-clock ms, ticking every second — drives the age text ("54 min ago") without freezing at whatever value first rendered. */
  now: number;
  /** True when this field's recordedAt just advanced on the most recent refresh — shows a "New" badge instead of quietly updating the number in place. */
  isNew?: boolean;
}> = ({ label, field, unit, format, now, isNew }) => {
  const { theme } = useTheme();
  const isPopulated = field.status === 'available' || field.status === 'available_zero';
  const displayValue = isPopulated ? (format ? format(field.value) : `${formatHcValue(field.value)}${unit ? ` ${unit}` : ''}`) : null;
  const statusLabel = field.status === 'permission_required' ? 'Permission Required' : 'Not Available';

  return (
    <View style={{ marginBottom: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
            {label}
          </AppText>
          {isPopulated && isNew ? (
            <View style={{ marginLeft: 6 }}>
              <AppBadge label="New" tone="success" />
            </View>
          ) : null}
        </View>
        {isPopulated ? (
          <AppText variant="bodySmall" weight="600" color="#FFFFFF">
            {displayValue}
          </AppText>
        ) : (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.35)">
            {statusLabel}
          </AppText>
        )}
      </View>
      {isPopulated ? (
        <AppText variant="caption" color="rgba(255,255,255,0.35)">
          {formatHcSource(field.source)}
          {field.recordedAt ? ` · Measured ${new Date(field.recordedAt).toLocaleTimeString()} · ${formatAge(field.recordedAt, now)}` : ''}
        </AppText>
      ) : null}
    </View>
  );
};

/** Reads whatever HealthKit's own sourceRevision/device metadata says — never assumes "Apple Watch". */
function formatHkSource(source: HealthKitSource | 'unknown' | null): string {
  if (source === null) return '';
  if (source === 'unknown') return 'Source Unknown';
  return [source.name, source.deviceName].filter(Boolean).join(' · ');
}

/** Structurally identical to HealthConnectFieldRow — kept as its own component per the "independent architecture" requirement rather than sharing one generic component across features. */
const HealthKitFieldRow: React.FC<{
  label: string;
  field: HealthKitField<unknown>;
  unit?: string;
  format?: (value: unknown) => string;
  now: number;
  isNew?: boolean;
}> = ({ label, field, unit, format, now, isNew }) => {
  const { theme } = useTheme();
  const isPopulated = field.status === 'available' || field.status === 'available_zero';
  const displayValue = isPopulated ? (format ? format(field.value) : `${formatHcValue(field.value)}${unit ? ` ${unit}` : ''}`) : null;
  const statusLabel = field.status === 'permission_required' ? 'Permission Required' : 'Not Available';

  return (
    <View style={{ marginBottom: theme.spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
            {label}
          </AppText>
          {isPopulated && isNew ? (
            <View style={{ marginLeft: 6 }}>
              <AppBadge label="New" tone="success" />
            </View>
          ) : null}
        </View>
        {isPopulated ? (
          <AppText variant="bodySmall" weight="600" color="#FFFFFF">
            {displayValue}
          </AppText>
        ) : (
          <AppText variant="bodySmall" color="rgba(255,255,255,0.35)">
            {statusLabel}
          </AppText>
        )}
      </View>
      {isPopulated ? (
        <AppText variant="caption" color="rgba(255,255,255,0.35)">
          {formatHkSource(field.source)}
          {field.recordedAt ? ` · Measured ${new Date(field.recordedAt).toLocaleTimeString()} · ${formatAge(field.recordedAt, now)}` : ''}
        </AppText>
      ) : null}
    </View>
  );
};

function formatHcValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
  return String(value ?? '');
}

function formatMinutesAsHM(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes)) return '—';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

const TimeAgo: React.FC<{ iso: string | null; now: number }> = ({ iso, now }) => {
  if (!iso) return <AppText variant="caption" color="rgba(255,255,255,0.35)">—</AppText>;
  const seconds = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  const label = seconds < 1 ? 'just now' : seconds < 60 ? `${seconds}s ago` : `${Math.round(seconds / 60)}m ago`;
  return (
    <AppText variant="caption" color={seconds > 15 ? 'rgba(255,190,120,0.85)' : 'rgba(150,255,190,0.85)'}>
      {label}
    </AppText>
  );
};

function formatValue(field: NoiseField<unknown>): string {
  if (field.status === 'not_available') return 'Not Available';
  if (field.status === 'unknown') return 'Unknown';
  if (field.status === 'error') return 'Error';
  const value = field.value;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(2);
  return String(value ?? '');
}
