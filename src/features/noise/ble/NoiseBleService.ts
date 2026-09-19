import { Platform, PermissionsAndroid } from 'react-native';
import { BleManager, Device, State, BleError, Subscription, Characteristic } from 'react-native-ble-plx';
import {
  NoiseDiscoveredDevice,
  NoiseServiceInfo,
  NoiseCharacteristicInfo,
  RawPacketLogEntry,
  NoiseDeviceInfo,
  NoiseActivityMetrics,
  PacketStats,
  createEmptyDeviceInfo,
  createEmptyActivityMetrics,
  availableField,
  unavailableField,
} from '../models';
import { base64ToBytes, bytesToHex } from './base64';
import { STANDARD_UUIDS, parseHeartRateMeasurement, parseBatteryLevel, parseUtf8String, parseRscMeasurement, speedToPaceMinPerKm } from './standardGattParsers';
import { VENDOR_STEPS_CHARACTERISTIC_UUID, parseStepsDeltaNotification } from './vendorActivityParsers';
import { getDeviceDisplayName, isLikelyNoiseDevice } from './deviceIdentity';
import { noiseLog } from './rawLogger';

export interface NoiseBleCallbacks {
  onDeviceDiscovered?: (device: NoiseDiscoveredDevice) => void;
  onScanError?: (message: string) => void;
  onConnected?: (deviceId: string, deviceName: string | null) => void;
  onConnectError?: (message: string) => void;
  onDisconnected?: (deviceId: string, reason?: string) => void;
  onReconnecting?: (attempt: number) => void;
  onReconnectFailed?: () => void;
  onServicesDiscovered?: (services: NoiseServiceInfo[]) => void;
  onRawPacket?: (entry: RawPacketLogEntry) => void;
  onDeviceInfoUpdate?: (info: NoiseDeviceInfo) => void;
  onActivityMetricsUpdate?: (metrics: NoiseActivityMetrics) => void;
  onPacketStatsUpdate?: (stats: PacketStats[]) => void;
}

const RSSI_POLL_INTERVAL_MS = 3000;
// Controlled retry, not an aggressive/infinite loop — three tries with
// growing gaps, then give up and let the user tap Connect again.
const RECONNECT_DELAYS_MS = [2000, 5000, 10000];
// Deliberately minutes, not seconds — this only refreshes read-only
// characteristics (battery etc.), not the notify-based ones that already
// stream on their own. A tight poll here would be the exact "read
// everything every 100ms" anti-pattern this feature is meant to avoid.
const AUTO_SYNC_INTERVAL_MS = 2 * 60 * 1000;

function characteristicProperties(c: Characteristic): string[] {
  const props: string[] = [];
  if (c.isReadable) props.push('read');
  if (c.isWritableWithResponse) props.push('write');
  if (c.isWritableWithoutResponse) props.push('writeWithoutResponse');
  if (c.isNotifiable) props.push('notify');
  if (c.isIndicatable) props.push('indicate');
  return props;
}

function toCharacteristicInfo(c: Characteristic): NoiseCharacteristicInfo {
  return {
    uuid: c.uuid,
    serviceUUID: c.serviceUUID,
    isReadable: c.isReadable,
    isWritableWithResponse: c.isWritableWithResponse,
    isWritableWithoutResponse: c.isWritableWithoutResponse,
    isNotifiable: c.isNotifiable,
    isIndicatable: c.isIndicatable,
  };
}

/**
 * BLE layer for the Noise smartwatch flow. Deliberately has zero
 * React/Redux imports — noiseSlice's thunks call into this and forward its
 * callbacks into dispatched actions, so this class stays reusable for any
 * future BLE wearable (Garmin/Fitbit/Samsung/etc.) behind the same shape:
 * scan() / connect() / disconnect() / discoverServices() /
 * subscribeToNotifications() / readData() / getActivityData().
 *
 * Live `Device`/`Characteristic`/`Subscription` instances are kept as
 * private fields here, never put into Redux — RTK's serializability check
 * would reject them (they're class instances with methods), and the app
 * only needs plain snapshots on the UI side anyway.
 *
 * The scan/connect/disconnect/discovery control flow below is unchanged
 * from the version already verified against a real Noise watch — only the
 * data-handling side (handleValue / decode / packet stats) was extended to
 * track per-field availability, source UUIDs and packet statistics for the
 * dashboard.
 */
class NoiseBleServiceImpl {
  private manager = new BleManager();
  private connectedDevice: Device | null = null;
  private notifySubscriptions: Subscription[] = [];
  private subscribedCharacteristicUUIDs = new Set<string>();
  private disconnectSubscription: Subscription | null = null;
  private rssiPollHandle: ReturnType<typeof setInterval> | null = null;
  private autoSyncPollHandle: ReturnType<typeof setInterval> | null = null;
  private isSyncing = false;

  // Connection-persistence bookkeeping — this class is a module-level
  // singleton (see bottom of file), so it already survives screen
  // unmount/navigation on its own; what it doesn't do by default is tell an
  // unexpected drop apart from a user-initiated one. That's the one bit of
  // state a screen component can't hold, since it needs to outlive the
  // screen: true only while disconnect() is running because the user tapped
  // it, false the instant a fresh connect() starts, checked by the
  // onDisconnected handler to decide whether to auto-reconnect.
  private manualDisconnect = false;
  private lastConnectedDeviceId: string | null = null;
  private lastCallbacks: NoiseBleCallbacks | null = null;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private discoveredServices: NoiseServiceInfo[] = [];
  private deviceInfo: NoiseDeviceInfo = createEmptyDeviceInfo();
  private activityMetrics: NoiseActivityMetrics = createEmptyActivityMetrics();
  private packetStats = new Map<string, PacketStats>();
  private heartRateStats = { sum: 0, count: 0, max: -Infinity, min: Infinity };
  private speedStats = { sum: 0, count: 0 };
  // The first raw delta byte seen this connection — steps reported are
  // relative to this, since the watch's own absolute baseline isn't
  // observable over BLE (see vendorActivityParsers.ts). Reset per-connection
  // in resetData() so a fresh connection starts a fresh "this session" count.
  private stepsSessionBaselineDelta: number | null = null;

  async getBluetoothState(): Promise<State> {
    const state = await this.manager.state();
    noiseLog.bleState(state);
    return state;
  }

  onBluetoothStateChange(listener: (state: State) => void): Subscription {
    return this.manager.onStateChange((state) => {
      noiseLog.bleState(state);
      listener(state);
    }, true);
  }

  /**
   * Android 12+ (API 31+) needs runtime BLUETOOTH_SCAN/BLUETOOTH_CONNECT
   * grants; older Android needs ACCESS_FINE_LOCATION for scan results to
   * come back at all (a platform quirk, not something this app chose).
   * iOS has no equivalent explicit call — the OS prompts automatically the
   * first time a Bluetooth API is used, driven by the
   * NSBluetoothAlwaysUsageDescription string in Info.plist.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      noiseLog.permission(true, 'iOS prompts automatically on first BLE use');
      return true;
    }

    const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(String(Platform.Version), 10);
    const permissions =
      apiLevel >= 31
        ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
        : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];

    const results = await PermissionsAndroid.requestMultiple(permissions);
    const granted = Object.values(results).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
    noiseLog.permission(granted, `Android API ${apiLevel}, requested: ${permissions.join(', ')}`);
    return granted;
  }

  startScan(callbacks: NoiseBleCallbacks): void {
    noiseLog.scanStarted();
    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error: BleError | null, device: Device | null) => {
      if (error) {
        noiseLog.error('Scan error', error);
        callbacks.onScanError?.(error.message);
        return;
      }
      if (!device) return;

      const now = new Date().toISOString();
      const displayName = getDeviceDisplayName(device);
      const isLikelySuggestedMatch = isLikelyNoiseDevice(device);
      noiseLog.deviceDiscoveredFull({
        name: device.name,
        localName: device.localName,
        id: device.id,
        rssi: device.rssi,
        manufacturerDataBase64: device.manufacturerData,
        serviceUUIDs: device.serviceUUIDs,
        serviceData: device.serviceData,
        rawScanRecordBase64: device.rawScanRecord,
      });
      if (isLikelySuggestedMatch) noiseLog.noiseDeviceIdentified(displayName, device.id);

      const discovered: NoiseDiscoveredDevice = {
        id: device.id,
        name: device.name,
        localName: device.localName,
        rssi: device.rssi,
        serviceUUIDs: device.serviceUUIDs,
        serviceData: device.serviceData,
        manufacturerDataBase64: device.manufacturerData,
        txPowerLevel: device.txPowerLevel,
        isConnectable: device.isConnectable,
        rawScanRecordBase64: device.rawScanRecord,
        isLikelySuggestedMatch,
        firstSeenAt: now,
        lastSeenAt: now,
        timesSeen: 1,
      };
      callbacks.onDeviceDiscovered?.(discovered);
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
    noiseLog.scanStopped();
  }

  /** Public entry point — a user- or app-driven connection attempt. Resets the reconnect/manual-disconnect bookkeeping so a fresh, deliberate connect always starts from a clean slate, then delegates to the shared implementation also used by the reconnect timer. */
  async connect(deviceId: string, callbacks: NoiseBleCallbacks): Promise<void> {
    this.manualDisconnect = false;
    this.lastConnectedDeviceId = deviceId;
    this.lastCallbacks = callbacks;
    this.reconnectAttempt = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    await this.establishConnection(deviceId, callbacks);
  }

  private async establishConnection(deviceId: string, callbacks: NoiseBleCallbacks): Promise<void> {
    noiseLog.connectStarted(deviceId);
    this.stopScan();
    this.resetData();

    let device: Device;
    try {
      device = await this.manager.connectToDevice(deviceId, { timeout: 15000 });
    } catch (error) {
      noiseLog.error('Connect failed', error);
      callbacks.onConnectError?.(error instanceof Error ? error.message : 'Connection failed');
      return;
    }

    this.connectedDevice = device;
    noiseLog.connectSucceeded(device.id, device.name);
    callbacks.onConnected?.(device.id, device.name);

    const now = new Date().toISOString();
    this.deviceInfo.deviceId = availableField(device.id, '', '', false, now);
    if (device.name) this.deviceInfo.deviceName = availableField(device.name, '', '', false, now);
    if (device.rssi !== null) this.deviceInfo.rssi = availableField(device.rssi, '', '', false, now);
    callbacks.onDeviceInfoUpdate?.(this.cloneDeviceInfo());

    this.disconnectSubscription = device.onDisconnected((error, disconnectedDevice) => {
      noiseLog.disconnected(disconnectedDevice.id, error?.message);
      this.cleanupSubscriptions();
      this.connectedDevice = null;
      callbacks.onDisconnected?.(disconnectedDevice.id, error?.message);

      // A drop this class didn't initiate itself (watch out of range,
      // powered off, OS-level BLE hiccup) is worth retrying automatically;
      // one the user asked for via disconnect() must never be undone.
      if (!this.manualDisconnect) this.scheduleReconnect(deviceId, callbacks);
    });

    try {
      await device.discoverAllServicesAndCharacteristics();
      const services = await device.services();
      noiseLog.servicesDiscovered(services.length);

      const serviceInfos: NoiseServiceInfo[] = [];
      for (const service of services) {
        noiseLog.service(service.uuid);
        const characteristics = await service.characteristics();
        const characteristicInfos: NoiseCharacteristicInfo[] = [];
        for (const characteristic of characteristics) {
          noiseLog.characteristic(characteristic.uuid, characteristicProperties(characteristic));
          characteristicInfos.push(toCharacteristicInfo(characteristic));
        }
        serviceInfos.push({ uuid: service.uuid, characteristics: characteristicInfos });
      }
      this.discoveredServices = serviceInfos;
      callbacks.onServicesDiscovered?.(serviceInfos);

      await this.readOneShotCharacteristics(device, serviceInfos, callbacks);
      this.subscribeToNotifications(device, serviceInfos, callbacks);
      this.startRssiPolling(device, callbacks);
    } catch (error) {
      noiseLog.error('Service/characteristic discovery failed', error);
      callbacks.onConnectError?.(error instanceof Error ? error.message : 'Service discovery failed');
    }
  }

  /** Controlled retry after an unexpected drop: 2s, 5s, 10s, then give up — never a tight/infinite loop, and never fired at all if the user tapped Disconnect (checked again inside the timer, since a manual disconnect can land while a retry is already scheduled). */
  private scheduleReconnect(deviceId: string, callbacks: NoiseBleCallbacks): void {
    if (this.reconnectAttempt >= RECONNECT_DELAYS_MS.length) {
      noiseLog.error('Reconnect', `Gave up after ${this.reconnectAttempt} attempt(s)`);
      callbacks.onReconnectFailed?.();
      return;
    }
    const delay = RECONNECT_DELAYS_MS[this.reconnectAttempt];
    this.reconnectAttempt += 1;
    noiseLog.error('Reconnect', `Attempt ${this.reconnectAttempt} in ${delay}ms`);
    callbacks.onReconnecting?.(this.reconnectAttempt);

    this.reconnectTimer = setTimeout(async () => {
      if (this.manualDisconnect) return;
      await this.establishConnection(deviceId, callbacks);
      if (this.connectedDevice) {
        this.reconnectAttempt = 0;
      } else if (!this.manualDisconnect) {
        this.scheduleReconnect(deviceId, callbacks);
      }
    }, delay);
  }

  /** The only path that should ever end a connection on purpose. Sets manualDisconnect first so the onDisconnected handler this triggers does not schedule a reconnect, and cancels any reconnect attempt already in flight. */
  async disconnect(): Promise<void> {
    this.manualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempt = 0;
    if (!this.connectedDevice) return;
    const id = this.connectedDevice.id;
    this.cleanupSubscriptions();
    try {
      await this.manager.cancelDeviceConnection(id);
    } catch (error) {
      noiseLog.error('Disconnect failed', error);
    }
    this.connectedDevice = null;
  }

  /**
   * "Sync Now" — a real BLE round-trip, not a UI refresh: re-reads every
   * currently-known readable characteristic on the connected device
   * (battery, device info, any read+notify vendor characteristic's
   * last-written value). Deliberately READ-only — this app does not write
   * commands to vendor characteristics; the Noise protocol isn't verified
   * yet, and guessing at command bytes is explicitly off the table. Notify-
   * based fields update on their own already (the subscriptions from
   * connect() are still live and get re-verified below); this only forces
   * the ones that need an explicit read.
   */
  async syncNow(callbacks: NoiseBleCallbacks): Promise<{ success: boolean; error?: string }> {
    if (!this.connectedDevice) return { success: false, error: 'not_connected' };
    if (this.isSyncing) return { success: false, error: 'sync_already_in_progress' };

    this.isSyncing = true;
    noiseLog.syncStarted();
    try {
      await this.readOneShotCharacteristics(this.connectedDevice, this.discoveredServices, callbacks);
      this.ensureNotificationsSubscribed(this.connectedDevice, this.discoveredServices, callbacks);
      noiseLog.syncFinished(true);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed';
      noiseLog.syncFinished(false, message);
      return { success: false, error: message };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Periodic re-read of read-only (non-notify) characteristics only —
   * battery being the main one worth refreshing on a timer, since it has
   * no notify property on this watch. Deliberately does NOT touch
   * notify-capable characteristics (they already update themselves) and
   * uses a multi-minute interval, not a tight poll, per the "avoid battery
   * drain / BLE congestion" requirement.
   */
  setAutoSync(enabled: boolean, callbacks: NoiseBleCallbacks): void {
    if (this.autoSyncPollHandle) {
      clearInterval(this.autoSyncPollHandle);
      this.autoSyncPollHandle = null;
    }
    if (!enabled) return;

    this.autoSyncPollHandle = setInterval(() => {
      if (!this.connectedDevice || this.isSyncing) return;
      const readOnlyTargets = this.discoveredServices.flatMap((s) => s.characteristics.filter((c) => c.isReadable && !c.isNotifiable && !c.isIndicatable));
      if (readOnlyTargets.length === 0) return;
      this.syncNow(callbacks);
    }, AUTO_SYNC_INTERVAL_MS);
  }

  getDeviceInfo(): NoiseDeviceInfo {
    return this.cloneDeviceInfo();
  }

  getActivityMetrics(): NoiseActivityMetrics {
    return this.cloneActivityMetrics();
  }

  getPacketStats(): PacketStats[] {
    return Array.from(this.packetStats.values());
  }

  private resetData(): void {
    this.discoveredServices = [];
    this.deviceInfo = createEmptyDeviceInfo();
    this.activityMetrics = createEmptyActivityMetrics();
    this.packetStats = new Map();
    this.heartRateStats = { sum: 0, count: 0, max: -Infinity, min: Infinity };
    this.speedStats = { sum: 0, count: 0 };
    this.stepsSessionBaselineDelta = null;
  }

  private cleanupSubscriptions() {
    this.notifySubscriptions.forEach((sub) => sub.remove());
    this.notifySubscriptions = [];
    this.subscribedCharacteristicUUIDs.clear();
    this.disconnectSubscription?.remove();
    this.disconnectSubscription = null;
    if (this.rssiPollHandle) {
      clearInterval(this.rssiPollHandle);
      this.rssiPollHandle = null;
    }
    if (this.autoSyncPollHandle) {
      clearInterval(this.autoSyncPollHandle);
      this.autoSyncPollHandle = null;
    }
  }

  private startRssiPolling(device: Device, callbacks: NoiseBleCallbacks): void {
    this.rssiPollHandle = setInterval(async () => {
      try {
        const updated = await device.readRSSI();
        if (updated.rssi !== null) {
          this.deviceInfo.rssi = availableField(updated.rssi, '', '', false, new Date().toISOString());
          callbacks.onDeviceInfoUpdate?.(this.cloneDeviceInfo());
        }
      } catch {
        // Device likely disconnected mid-poll — onDisconnected handles cleanup, nothing else to do here.
      }
    }, RSSI_POLL_INTERVAL_MS);
  }

  /** Battery/Device Information are typically read-once, not notified — read them immediately after connecting, and this is also exactly what "Sync Now" re-runs on demand. */
  private async readOneShotCharacteristics(device: Device, services: NoiseServiceInfo[], callbacks: NoiseBleCallbacks): Promise<void> {
    const readableTargets = services.flatMap((s) => s.characteristics.filter((c) => c.isReadable));
    for (const target of readableTargets) {
      try {
        noiseLog.syncReading(target.serviceUUID, target.uuid);
        const characteristic = await device.readCharacteristicForService(target.serviceUUID, target.uuid);
        if (characteristic.value) this.handleValue(characteristic.serviceUUID, characteristic.uuid, characteristic.value, false, callbacks);
      } catch (error) {
        noiseLog.error(`Read failed for ${target.uuid}`, error);
      }
    }
  }

  /** Subscribes to every notify/indicate-capable characteristic discovered — standard or vendor-specific alike, so nothing the watch actually streams is missed even if we can't decode it. */
  private subscribeToNotifications(device: Device, services: NoiseServiceInfo[], callbacks: NoiseBleCallbacks): void {
    const notifiableTargets = services.flatMap((s) => s.characteristics.filter((c) => c.isNotifiable || c.isIndicatable));
    for (const target of notifiableTargets) {
      this.subscribeOne(device, target.serviceUUID, target.uuid, callbacks);
    }
  }

  /**
   * Re-checks that every notify/indicate characteristic has a live
   * subscription and (re)subscribes anything missing — e.g. one that failed
   * silently during connect(). Never re-subscribes an already-tracked
   * characteristic, since react-native-ble-plx would stack a second live
   * listener rather than replace the first, producing duplicate callbacks.
   */
  private ensureNotificationsSubscribed(device: Device, services: NoiseServiceInfo[], callbacks: NoiseBleCallbacks): void {
    const notifiableTargets = services.flatMap((s) => s.characteristics.filter((c) => c.isNotifiable || c.isIndicatable));
    for (const target of notifiableTargets) {
      if (this.subscribedCharacteristicUUIDs.has(target.uuid)) continue;
      this.subscribeOne(device, target.serviceUUID, target.uuid, callbacks);
    }
  }

  private subscribeOne(device: Device, serviceUUID: string, characteristicUUID: string, callbacks: NoiseBleCallbacks): void {
    const subscription = device.monitorCharacteristicForService(serviceUUID, characteristicUUID, (error, characteristic) => {
      if (error) {
        noiseLog.subscribeFailed(characteristicUUID, error.message);
        this.subscribedCharacteristicUUIDs.delete(characteristicUUID);
        return;
      }
      if (characteristic?.value) this.handleValue(serviceUUID, characteristicUUID, characteristic.value, true, callbacks);
    });
    this.notifySubscriptions.push(subscription);
    this.subscribedCharacteristicUUIDs.add(characteristicUUID);
    noiseLog.subscribed(characteristicUUID);
  }

  /** Every read/notification passes through here: record packet stats (always), log raw hex+decimal always, then attempt a standard-GATT decode and merge into the normalized model — vendor-specific characteristics get packet stats but stay unparsed. */
  private handleValue(serviceUUID: string, characteristicUUID: string, base64Value: string, isNotify: boolean, callbacks: NoiseBleCallbacks): void {
    const bytes = base64ToBytes(base64Value);
    const decimalBytes = Array.from(bytes);
    const hex = bytesToHex(bytes);
    const timestamp = new Date().toISOString();

    const parsedAs = this.applyStandardDecode(serviceUUID, characteristicUUID, base64Value, isNotify, timestamp) ?? this.applyVendorActivityDecode(serviceUUID, characteristicUUID, bytes, isNotify, timestamp);
    this.recordPacketStats(serviceUUID, characteristicUUID, hex, decimalBytes, isNotify, parsedAs, timestamp, callbacks);

    noiseLog.rawPacket(characteristicUUID, hex);
    const entry: RawPacketLogEntry = { timestamp, serviceUUID, characteristicUUID, type: isNotify ? 'notification' : 'read', hex, decimalBytes, parsedAs };
    callbacks.onRawPacket?.(entry);

    if (!parsedAs) {
      noiseLog.unrecognized(characteristicUUID);
      return;
    }
    noiseLog.parsedData(parsedAs, { device: this.deviceInfo, activity: this.activityMetrics });
    callbacks.onDeviceInfoUpdate?.(this.cloneDeviceInfo());
    callbacks.onActivityMetricsUpdate?.(this.cloneActivityMetrics());
  }

  private recordPacketStats(
    serviceUUID: string,
    characteristicUUID: string,
    hex: string,
    decimalBytes: number[],
    isNotify: boolean,
    parsedAs: string | null,
    timestamp: string,
    callbacks: NoiseBleCallbacks
  ): void {
    const existing = this.packetStats.get(characteristicUUID);
    const totalPackets = (existing?.totalPackets ?? 0) + 1;
    const firstPacketAt = existing?.firstPacketAt ?? timestamp;
    const elapsedSeconds = Math.max(0.001, (new Date(timestamp).getTime() - new Date(firstPacketAt).getTime()) / 1000);
    const packetsPerSecond = totalPackets / elapsedSeconds;

    this.packetStats.set(characteristicUUID, {
      serviceUUID,
      characteristicUUID,
      totalPackets,
      firstPacketAt,
      lastPacketAt: timestamp,
      lastHex: hex,
      lastDecimalBytes: decimalBytes,
      payloadSizeBytes: decimalBytes.length,
      packetsPerSecond,
      isNotify,
      parsedAs,
    });
    callbacks.onPacketStatsUpdate?.(this.getPacketStats());
  }

  /** Returns the label of what was decoded, or null if this characteristic isn't one of the standard services this app knows how to parse. Mutates deviceInfo/activityMetrics in place on success, always via availableField() so a genuine 0 is never collapsed into "not available". */
  private applyStandardDecode(serviceUUID: string, characteristicUUID: string, base64Value: string, isNotify: boolean, timestamp: string): string | null {
    const uuid = characteristicUUID.toLowerCase();

    if (uuid === STANDARD_UUIDS.deviceNameCharacteristic) {
      const name = parseUtf8String(base64Value);
      if (!name) return null;
      this.deviceInfo.deviceName = availableField(name, serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'deviceName';
    }

    if (uuid === STANDARD_UUIDS.heartRateMeasurement) {
      const reading = parseHeartRateMeasurement(base64Value);
      if (!reading) return null;
      this.activityMetrics.heartRateBpm = availableField(reading.heartRateBpm, serviceUUID, characteristicUUID, isNotify, timestamp);
      this.applyHeartRateStats(reading.heartRateBpm, serviceUUID, characteristicUUID, timestamp);
      if (reading.energyExpendedKj !== null) {
        const kcal = Math.round(reading.energyExpendedKj * 0.239006);
        this.activityMetrics.caloriesKcal = availableField(kcal, serviceUUID, characteristicUUID, isNotify, timestamp);
      }
      return 'heartRate';
    }

    if (uuid === STANDARD_UUIDS.batteryLevel) {
      const percent = parseBatteryLevel(base64Value);
      if (percent === null) return null;
      this.deviceInfo.batteryPercent = availableField(percent, serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'batteryLevel';
    }

    if (uuid === STANDARD_UUIDS.manufacturerNameString) {
      this.deviceInfo.manufacturer = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'manufacturerName';
    }

    if (uuid === STANDARD_UUIDS.modelNumberString) {
      this.deviceInfo.model = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'modelNumber';
    }

    if (uuid === STANDARD_UUIDS.serialNumberString) {
      this.deviceInfo.serialNumber = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'serialNumber';
    }

    if (uuid === STANDARD_UUIDS.firmwareRevisionString) {
      this.deviceInfo.firmwareRevision = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'firmwareRevision';
    }

    if (uuid === STANDARD_UUIDS.hardwareRevisionString) {
      this.deviceInfo.hardwareRevision = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'hardwareRevision';
    }

    if (uuid === STANDARD_UUIDS.softwareRevisionString) {
      this.deviceInfo.softwareRevision = availableField(parseUtf8String(base64Value), serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'softwareRevision';
    }

    if (uuid === STANDARD_UUIDS.rscMeasurement) {
      const reading = parseRscMeasurement(base64Value);
      if (!reading) return null;
      this.activityMetrics.speedMetersPerSecond = availableField(reading.speedMetersPerSecond, serviceUUID, characteristicUUID, isNotify, timestamp);
      this.activityMetrics.cadenceRpm = availableField(reading.cadenceRpm, serviceUUID, characteristicUUID, isNotify, timestamp);
      const pace = speedToPaceMinPerKm(reading.speedMetersPerSecond);
      if (pace !== null) this.activityMetrics.paceMinPerKm = availableField(pace, serviceUUID, characteristicUUID, isNotify, timestamp);
      if (reading.totalDistanceMeters !== null) this.activityMetrics.distanceMeters = availableField(reading.totalDistanceMeters, serviceUUID, characteristicUUID, isNotify, timestamp);
      this.activityMetrics.activityType = availableField(reading.isRunning ? 'running' : 'walking', serviceUUID, characteristicUUID, isNotify, timestamp);
      this.applySpeedStats(reading.speedMetersPerSecond, serviceUUID, characteristicUUID, timestamp);
      return 'runningSpeedAndCadence';
    }

    return null;
  }

  /**
   * Decoders for proprietary characteristics confirmed via captured HCI
   * traffic cross-referenced against ground-truth watch-face values (see
   * vendorActivityParsers.ts) — never from public spec, never guessed.
   * Deliberately separate from applyStandardDecode (Bluetooth-SIG only).
   */
  private applyVendorActivityDecode(serviceUUID: string, characteristicUUID: string, bytes: Uint8Array, isNotify: boolean, timestamp: string): string | null {
    const uuid = characteristicUUID.toLowerCase();

    if (uuid === VENDOR_STEPS_CHARACTERISTIC_UUID) {
      const raw = parseStepsDeltaNotification(bytes);
      if (raw === null) return null;
      // First observation this connection, or the watch's own internal
      // reference reset underneath us — re-baseline rather than report a
      // negative or bogus count. The absolute daily total isn't observable
      // over BLE (see vendorActivityParsers.ts), so this is always relative
      // to whatever this connection first saw.
      if (this.stepsSessionBaselineDelta === null || raw < this.stepsSessionBaselineDelta) {
        this.stepsSessionBaselineDelta = raw;
      }
      const stepsThisSession = raw - this.stepsSessionBaselineDelta;
      this.activityMetrics.steps = availableField(stepsThisSession, serviceUUID, characteristicUUID, isNotify, timestamp);
      return 'stepsSessionDelta';
    }

    return null;
  }

  /** Same reasoning as applyHeartRateStats: RSC Measurement only carries an instantaneous speed, so "average pace/speed" is a running mean of genuine readings computed here — not a separate BLE field, and not fabricated. */
  private applySpeedStats(speedMetersPerSecond: number, serviceUUID: string, characteristicUUID: string, timestamp: string): void {
    this.speedStats.sum += speedMetersPerSecond;
    this.speedStats.count += 1;
    const avgSpeed = this.speedStats.sum / this.speedStats.count;
    this.activityMetrics.avgSpeedMetersPerSecond = availableField(avgSpeed, serviceUUID, characteristicUUID, true, timestamp);
    const avgPace = speedToPaceMinPerKm(avgSpeed);
    if (avgPace !== null) this.activityMetrics.avgPaceMinPerKm = availableField(avgPace, serviceUUID, characteristicUUID, true, timestamp);
  }

  private applyHeartRateStats(bpm: number, serviceUUID: string, characteristicUUID: string, timestamp: string): void {
    this.heartRateStats.sum += bpm;
    this.heartRateStats.count += 1;
    this.heartRateStats.max = Math.max(this.heartRateStats.max, bpm);
    this.heartRateStats.min = Math.min(this.heartRateStats.min, bpm);
    const avg = Math.round(this.heartRateStats.sum / this.heartRateStats.count);
    this.activityMetrics.avgHeartRateBpm = availableField(avg, serviceUUID, characteristicUUID, true, timestamp);
    this.activityMetrics.maxHeartRateBpm = availableField(this.heartRateStats.max, serviceUUID, characteristicUUID, true, timestamp);
    this.activityMetrics.minHeartRateBpm = availableField(this.heartRateStats.min, serviceUUID, characteristicUUID, true, timestamp);
  }

  private cloneDeviceInfo(): NoiseDeviceInfo {
    return { ...this.deviceInfo };
  }

  private cloneActivityMetrics(): NoiseActivityMetrics {
    return { ...this.activityMetrics };
  }
}

export const noiseBleService = new NoiseBleServiceImpl();
