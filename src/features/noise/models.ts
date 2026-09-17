/**
 * Connection lifecycle for the Noise smartwatch flow. Maps directly to the
 * states the UI needs to render (see NoiseDeviceScreen): idle before any
 * action, bluetooth_unavailable/permission_denied are terminal until the
 * user fixes them outside the app, scanning -> device_found -> connecting
 * -> connected is the happy path, disconnected is reachable from connected
 * (manual or unexpected drop), error is any operation failure with a
 * message attached separately in the slice.
 */
export type NoiseConnectionState =
  | 'idle'
  | 'bluetooth_unavailable'
  | 'permission_denied'
  | 'scanning'
  | 'device_found'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

/** A plain, serializable snapshot of a scanned BLE peripheral — never the live `Device` instance (that stays inside NoiseBleService, out of Redux). */
export interface NoiseDiscoveredDevice {
  id: string;
  name: string | null;
  localName: string | null;
  rssi: number | null;
  serviceUUIDs: string[] | null;
  /** Per-service-UUID advertised data, Base64-encoded — react-native-ble-plx's own shape. */
  serviceData: Record<string, string> | null;
  manufacturerDataBase64: string | null;
  txPowerLevel: number | null;
  isConnectable: boolean | null;
  /** The full raw advertisement blob, Base64 — for devices too unfamiliar to identify from the parsed fields alone. */
  rawScanRecordBase64: string | null;
  /** True if the resolved display name contains "noise" (case-insensitive) — a hint, not a guarantee, since the exact name string for a given Noise model isn't known ahead of a real scan. Never inferred from manufacturer data or service UUIDs (unverified without documentation — see ble/deviceIdentity.ts). */
  isLikelySuggestedMatch: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  timesSeen: number;
}

export interface NoiseCharacteristicInfo {
  uuid: string;
  serviceUUID: string;
  isReadable: boolean;
  isWritableWithResponse: boolean;
  isWritableWithoutResponse: boolean;
  isNotifiable: boolean;
  isIndicatable: boolean;
}

export interface NoiseServiceInfo {
  uuid: string;
  characteristics: NoiseCharacteristicInfo[];
}

/** One raw notification/read, kept for the on-screen debug log and console output. Ring-buffered by the slice (see MAX_RAW_LOG_ENTRIES). */
export interface RawPacketLogEntry {
  timestamp: string;
  serviceUUID: string;
  characteristicUUID: string;
  type: 'notification' | 'read';
  hex: string;
  decimalBytes: number[];
  /** Set when a standard-GATT parser recognized this characteristic (e.g. "heartRate"), null when the payload is vendor-specific and only logged raw. */
  parsedAs: string | null;
}

/**
 * Every data point on the dashboard is one of these instead of a bare
 * value — the whole point is to distinguish "never populated" from "BLE
 * genuinely reported zero" from "we don't know yet", which a bare
 * `number | null` can't express (null would mean two different things).
 */
export type FieldAvailability = 'available' | 'available_zero' | 'not_available' | 'unknown' | 'error';

export interface NoiseField<T = number> {
  status: FieldAvailability;
  value: T | null;
  serviceUUID: string | null;
  characteristicUUID: string | null;
  lastUpdatedAt: string | null;
  /** True if the source characteristic is notify/indicate (streams on its own); false if it's read-once (e.g. battery, device info). */
  isRealtime: boolean;
}

export function unavailableField<T = number>(): NoiseField<T> {
  return { status: 'not_available', value: null, serviceUUID: null, characteristicUUID: null, lastUpdatedAt: null, isRealtime: false };
}

/** Builds a populated field, correctly distinguishing a genuine zero from any other value — never collapses 0 into "not available". */
export function availableField<T>(value: T, serviceUUID: string, characteristicUUID: string, isRealtime: boolean, timestamp: string): NoiseField<T> {
  const status: FieldAvailability = typeof value === 'number' && value === 0 ? 'available_zero' : 'available';
  return { status, value, serviceUUID, characteristicUUID, lastUpdatedAt: timestamp, isRealtime };
}

export interface NoiseDeviceInfo {
  deviceName: NoiseField<string>;
  deviceId: NoiseField<string>;
  manufacturer: NoiseField<string>;
  model: NoiseField<string>;
  serialNumber: NoiseField<string>;
  firmwareRevision: NoiseField<string>;
  hardwareRevision: NoiseField<string>;
  softwareRevision: NoiseField<string>;
  batteryPercent: NoiseField<number>;
  /** Basic Battery Level (0x2A19) carries no charging-state bit — this stays not_available unless the watch also exposes the newer Battery Level Status (0x2BED) extended characteristic, which is uncommon on budget wearables. */
  batteryCharging: NoiseField<boolean>;
  rssi: NoiseField<number>;
}

export interface NoiseActivityMetrics {
  activityType: NoiseField<string>;
  workoutState: NoiseField<string>;
  /** Steps taken since this BLE connection was established — verified against a proprietary notification (see ble/vendorActivityParsers.ts), but only as a relative delta. The watch's absolute daily total isn't observable anywhere in the currently-decoded protocol, so this is never the watch face's displayed count. */
  steps: NoiseField<number>;
  distanceMeters: NoiseField<number>;
  durationSeconds: NoiseField<number>;
  caloriesKcal: NoiseField<number>;
  activeCaloriesKcal: NoiseField<number>;
  heartRateBpm: NoiseField<number>;
  /** Computed client-side as real readings arrive (sum/count/max/min of actual heartRateBpm notifications this session) — the Heart Rate Measurement characteristic itself only carries an instantaneous value, there's no BLE-native average/max/min. Clearly not a fabricated value: it's a running aggregate of genuine readings. */
  avgHeartRateBpm: NoiseField<number>;
  maxHeartRateBpm: NoiseField<number>;
  minHeartRateBpm: NoiseField<number>;
  paceMinPerKm: NoiseField<number>;
  avgPaceMinPerKm: NoiseField<number>;
  speedMetersPerSecond: NoiseField<number>;
  avgSpeedMetersPerSecond: NoiseField<number>;
  cadenceRpm: NoiseField<number>;
  elevationMeters: NoiseField<number>;
  floors: NoiseField<number>;
  gpsAvailable: NoiseField<boolean>;
  spo2Percent: NoiseField<number>;
  /** Free-text summary, populated only if a future vendor parser produces one directly — the structured fields below are what the Sleep UI section actually reads. */
  sleepData: NoiseField<string>;
  sleepDurationMinutes: NoiseField<number>;
  sleepDeepMinutes: NoiseField<number>;
  sleepLightMinutes: NoiseField<number>;
  sleepRemMinutes: NoiseField<number>;
  sleepAwakeMinutes: NoiseField<number>;
  stressLevel: NoiseField<number>;
}

export function createEmptyDeviceInfo(): NoiseDeviceInfo {
  return {
    deviceName: unavailableField(),
    deviceId: unavailableField(),
    manufacturer: unavailableField(),
    model: unavailableField(),
    serialNumber: unavailableField(),
    firmwareRevision: unavailableField(),
    hardwareRevision: unavailableField(),
    softwareRevision: unavailableField(),
    batteryPercent: unavailableField(),
    batteryCharging: unavailableField(),
    rssi: unavailableField(),
  };
}

export function createEmptyActivityMetrics(): NoiseActivityMetrics {
  return {
    activityType: unavailableField(),
    workoutState: unavailableField(),
    steps: unavailableField(),
    distanceMeters: unavailableField(),
    durationSeconds: unavailableField(),
    caloriesKcal: unavailableField(),
    activeCaloriesKcal: unavailableField(),
    heartRateBpm: unavailableField(),
    avgHeartRateBpm: unavailableField(),
    maxHeartRateBpm: unavailableField(),
    minHeartRateBpm: unavailableField(),
    paceMinPerKm: unavailableField(),
    avgPaceMinPerKm: unavailableField(),
    speedMetersPerSecond: unavailableField(),
    avgSpeedMetersPerSecond: unavailableField(),
    cadenceRpm: unavailableField(),
    elevationMeters: unavailableField(),
    floors: unavailableField(),
    gpsAvailable: unavailableField(),
    spo2Percent: unavailableField(),
    sleepData: unavailableField(),
    sleepDurationMinutes: unavailableField(),
    sleepDeepMinutes: unavailableField(),
    sleepLightMinutes: unavailableField(),
    sleepRemMinutes: unavailableField(),
    sleepAwakeMinutes: unavailableField(),
    stressLevel: unavailableField(),
  };
}

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';

/** Per-characteristic packet statistics — drives both the "Unknown / Unparsed Data" section and the technical stats shown under each known characteristic. */
export interface PacketStats {
  serviceUUID: string;
  characteristicUUID: string;
  totalPackets: number;
  firstPacketAt: string;
  lastPacketAt: string;
  lastHex: string;
  lastDecimalBytes: number[];
  payloadSizeBytes: number;
  packetsPerSecond: number;
  isNotify: boolean;
  /** Null means no standard-GATT parser recognizes this characteristic — it belongs in "Unknown / Unparsed Data", not because nothing was decoded but because this app doesn't know its format yet. */
  parsedAs: string | null;
}

/** Shared label/tone mapping for NoiseConnectionState — used by both the HealthIntegrationsScreen row and NoiseDeviceScreen's banner so the two stay in sync. */
export const NOISE_STATE_COPY: Record<NoiseConnectionState, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  idle: { label: 'Not Connected', tone: 'neutral' },
  bluetooth_unavailable: { label: 'Bluetooth Unavailable', tone: 'danger' },
  permission_denied: { label: 'Permission Denied', tone: 'danger' },
  scanning: { label: 'Scanning…', tone: 'info' },
  device_found: { label: 'Device Found', tone: 'info' },
  connecting: { label: 'Connecting…', tone: 'warning' },
  connected: { label: 'Connected', tone: 'success' },
  reconnecting: { label: 'Reconnecting…', tone: 'warning' },
  disconnected: { label: 'Disconnected', tone: 'neutral' },
  error: { label: 'Connection Error', tone: 'danger' },
};

/** Availability-status label/tone — shared by the Data Availability table and every individual field row. */
export const FIELD_STATUS_COPY: Record<FieldAvailability, { label: string; tone: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
  available: { label: 'Available', tone: 'success' },
  available_zero: { label: 'Available (0)', tone: 'info' },
  not_available: { label: 'Not Available', tone: 'neutral' },
  unknown: { label: 'Unknown', tone: 'warning' },
  error: { label: 'Error', tone: 'danger' },
};
