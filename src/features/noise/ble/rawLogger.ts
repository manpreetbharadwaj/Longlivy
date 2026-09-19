/**
 * Structured console logging for the Noise BLE flow — kept as one module so
 * every log line uses the exact prefixes requested for debugging/reverse-
 * engineering the watch's protocol (grep-able in a device console).
 */
const PREFIX = {
  ble: '[NOISE-BLE]',
  scan: '[NOISE-SCAN]',
  connect: '[NOISE-CONNECT]',
  service: '[NOISE-SERVICE]',
  char: '[NOISE-CHAR]',
  device: '[NOISE-DEVICE]',
  battery: '[NOISE-BATTERY]',
  activity: '[NOISE-ACTIVITY]',
  data: '[NOISE-DATA]',
  raw: '[NOISE-RAW]',
  sync: '[NOISE-SYNC]',
  error: '[NOISE-ERROR]',
} as const;

export const noiseLog = {
  bleState: (state: string) => console.log(`${PREFIX.ble} Bluetooth adapter state: ${state}`),
  permission: (granted: boolean, detail?: string) => console.log(`${PREFIX.ble} Permission ${granted ? 'granted' : 'denied'}${detail ? ` — ${detail}` : ''}`),

  scanStarted: () => console.log(`${PREFIX.scan} Scan started`),
  scanStopped: () => console.log(`${PREFIX.scan} Scan stopped`),
  /** Full per-device advertisement dump — every field the raw log/Details panel promises, so an "Unnamed" watch can still be identified from its console output. */
  deviceDiscoveredFull: (info: {
    name: string | null;
    localName: string | null;
    id: string;
    rssi: number | null;
    manufacturerDataBase64: string | null;
    serviceUUIDs: string[] | null;
    serviceData: Record<string, string> | null;
    rawScanRecordBase64: string | null;
  }) =>
    console.log(
      `${PREFIX.scan}\n` +
        `  Name: ${info.name ?? '(none)'}\n` +
        `  Local Name: ${info.localName ?? '(none)'}\n` +
        `  Device ID: ${info.id}\n` +
        `  RSSI: ${info.rssi ?? 'unknown'}\n` +
        `  Manufacturer Data: ${info.manufacturerDataBase64 ?? '(none)'}\n` +
        `  Service UUIDs: ${info.serviceUUIDs?.join(', ') ?? '(none advertised)'}\n` +
        `  Service Data: ${info.serviceData ? JSON.stringify(info.serviceData) : '(none)'}\n` +
        `  Advertisement Data: ${info.rawScanRecordBase64 ?? '(none)'}`
    ),
  noiseDeviceIdentified: (name: string | null, id: string) => console.log(`${PREFIX.scan} Noise device identified (name match): ${name} (${id})`),

  connectStarted: (id: string) => console.log(`${PREFIX.connect} Connecting to ${id}`),
  connectSucceeded: (id: string, name: string | null) => console.log(`${PREFIX.connect} Connected to ${name ?? '(unnamed)'} (${id})`),
  disconnected: (id: string, reason?: string) => console.log(`${PREFIX.connect} Disconnected from ${id}${reason ? ` — ${reason}` : ''}`),

  servicesDiscovered: (count: number) => console.log(`${PREFIX.service} Discovered ${count} service(s)`),
  service: (uuid: string) => console.log(`${PREFIX.service} Service: ${uuid}`),

  characteristic: (uuid: string, properties: string[]) => console.log(`${PREFIX.char} Characteristic: ${uuid}\n  Properties: ${properties.join(', ') || '(none)'}`),
  subscribed: (uuid: string) => console.log(`${PREFIX.char} Subscribed to notifications: ${uuid}`),
  subscribeFailed: (uuid: string, message: string) => console.log(`${PREFIX.error} Failed to subscribe to ${uuid}: ${message}`),

  device: (info: unknown) => console.log(`${PREFIX.device}`, info),
  battery: (percent: number) => console.log(`${PREFIX.battery} ${percent}%`),
  activity: (metrics: unknown) => console.log(`${PREFIX.activity}`, metrics),

  rawPacket: (characteristicUUID: string, hex: string) => console.log(`${PREFIX.raw} [${characteristicUUID}]:\n  HEX: ${hex}`),
  parsedData: (label: string, value: unknown) => console.log(`${PREFIX.data} PARSED (${label}):\n  ${JSON.stringify(value, null, 2)}`),
  unrecognized: (characteristicUUID: string) => console.log(`${PREFIX.data} Characteristic ${characteristicUUID} is vendor-specific — not available through currently exposed standard BLE parsers.`),

  error: (context: string, error: unknown) => console.log(`${PREFIX.error} ${context}:`, error instanceof Error ? error.message : error),

  syncStarted: () => console.log(`${PREFIX.sync} Sync started · ${new Date().toISOString()}`),
  activityTriggerStarted: (count: number) => console.log(`${PREFIX.sync} Activity sync trigger: writing ${count} verified command(s)`),
  activityTriggerWrote: (hex: string) => console.log(`${PREFIX.sync} Activity sync trigger: wrote ${hex}`),
  activityTriggerDone: () => console.log(`${PREFIX.sync} Activity sync trigger: all writes completed`),
  syncReading: (serviceUUID: string, characteristicUUID: string) => console.log(`${PREFIX.sync} Reading:\n  Service: ${serviceUUID}\n  Characteristic: ${characteristicUUID}`),
  syncFinished: (success: boolean, error?: string) => {
    const suffix = error ? ` — ${error}` : '';
    console.log(`${PREFIX.sync} Sync ${success ? 'completed' : 'failed'}${suffix}`);
  },
};
