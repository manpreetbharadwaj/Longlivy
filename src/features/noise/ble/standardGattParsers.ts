import { base64ToBytes } from './base64';

/**
 * Decoders for OFFICIAL Bluetooth SIG-defined services/characteristics
 * only — these byte layouts are public specification, not guessed. If the
 * Noise watch happens to expose any of these (common even on watches whose
 * step/distance/calorie data is otherwise proprietary), the values here are
 * genuinely trustworthy. Anything not listed here is vendor-specific and is
 * intentionally left to raw hex logging in NoiseBleService — see that
 * file's comment on why proprietary payloads aren't guessed at.
 */

function fullUuid(short16bit: string): string {
  return `0000${short16bit}-0000-1000-8000-00805f9b34fb`;
}

export const STANDARD_UUIDS = {
  genericAccessService: fullUuid('1800'),
  deviceNameCharacteristic: fullUuid('2a00'),

  heartRateService: fullUuid('180d'),
  heartRateMeasurement: fullUuid('2a37'),

  batteryService: fullUuid('180f'),
  batteryLevel: fullUuid('2a19'),

  deviceInformationService: fullUuid('180a'),
  manufacturerNameString: fullUuid('2a29'),
  modelNumberString: fullUuid('2a24'),
  firmwareRevisionString: fullUuid('2a26'),
  hardwareRevisionString: fullUuid('2a27'),
  softwareRevisionString: fullUuid('2a28'),
  serialNumberString: fullUuid('2a25'),

  runningSpeedAndCadenceService: fullUuid('1814'),
  rscMeasurement: fullUuid('2a53'),
} as const;

export interface HeartRateReading {
  heartRateBpm: number;
  /** Present only if the device sets the Energy Expended flag bit. */
  energyExpendedKj: number | null;
}

/** Heart Rate Measurement (0x2A37) — flags byte then either UINT8 or UINT16 HR value, optional energy-expended UINT16 (kJ), optional RR-intervals (ignored here, not part of this app's data model). */
export function parseHeartRateMeasurement(base64Value: string): HeartRateReading | null {
  const bytes = base64ToBytes(base64Value);
  if (bytes.length < 2) return null;

  const flags = bytes[0];
  const is16Bit = (flags & 0x01) !== 0;
  const energyExpendedPresent = (flags & 0x08) !== 0;

  let offset = 1;
  let heartRateBpm: number;
  if (is16Bit) {
    if (bytes.length < offset + 2) return null;
    heartRateBpm = bytes[offset] | (bytes[offset + 1] << 8);
    offset += 2;
  } else {
    heartRateBpm = bytes[offset];
    offset += 1;
  }

  let energyExpendedKj: number | null = null;
  if (energyExpendedPresent && bytes.length >= offset + 2) {
    energyExpendedKj = bytes[offset] | (bytes[offset + 1] << 8);
  }

  return { heartRateBpm, energyExpendedKj };
}

/** Battery Level (0x2A19) — single byte, 0-100. */
export function parseBatteryLevel(base64Value: string): number | null {
  const bytes = base64ToBytes(base64Value);
  if (bytes.length < 1) return null;
  return bytes[0];
}

/** Device Information strings (Manufacturer/Model/Firmware/Hardware/Serial) are plain UTF-8 text. */
export function parseUtf8String(base64Value: string): string {
  const bytes = base64ToBytes(base64Value);
  let result = '';
  for (let i = 0; i < bytes.length; i++) result += String.fromCharCode(bytes[i]);
  return result;
}

export interface RscReading {
  speedMetersPerSecond: number;
  cadenceRpm: number;
  strideLengthMeters: number | null;
  totalDistanceMeters: number | null;
  isRunning: boolean;
}

/**
 * Running Speed and Cadence Measurement (0x2A53) — flags byte (bit0: stride
 * length present, bit1: total distance present, bit2: 1=running/0=walking),
 * then Instantaneous Speed (UINT16, 1/256 m/s resolution), Instantaneous
 * Cadence (UINT8, RPM/steps-per-minute), optional Instantaneous Stride
 * Length (UINT16, 1/100 m), optional Total Distance (UINT32, 1/10 m).
 */
export function parseRscMeasurement(base64Value: string): RscReading | null {
  const bytes = base64ToBytes(base64Value);
  if (bytes.length < 4) return null;

  const flags = bytes[0];
  const strideLengthPresent = (flags & 0x01) !== 0;
  const totalDistancePresent = (flags & 0x02) !== 0;
  const isRunning = (flags & 0x04) !== 0;

  const speedRaw = bytes[1] | (bytes[2] << 8);
  const speedMetersPerSecond = speedRaw / 256;
  const cadenceRpm = bytes[3];

  let offset = 4;
  let strideLengthMeters: number | null = null;
  if (strideLengthPresent && bytes.length >= offset + 2) {
    strideLengthMeters = (bytes[offset] | (bytes[offset + 1] << 8)) / 100;
    offset += 2;
  }

  let totalDistanceMeters: number | null = null;
  if (totalDistancePresent && bytes.length >= offset + 4) {
    const raw = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
    totalDistanceMeters = raw / 10;
  }

  return { speedMetersPerSecond, cadenceRpm, strideLengthMeters, totalDistanceMeters, isRunning };
}

export function speedToPaceMinPerKm(speedMetersPerSecond: number): number | null {
  if (speedMetersPerSecond <= 0) return null;
  const kmPerHour = speedMetersPerSecond * 3.6;
  return 60 / kmPerHour;
}
