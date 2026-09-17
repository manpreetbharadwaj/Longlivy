import { NoiseDiscoveredDevice } from '../models';

/**
 * Best-effort display name for a scanned BLE peripheral. Priority: the
 * advertised local name (what most peripherals actually set), then the
 * platform-resolved device name, then an honest fallback — never a guessed
 * or fabricated manufacturer name. A device with no readable name still
 * gets shown (see the Details panel in NoiseDeviceScreen), just labeled
 * accurately instead of hidden.
 */
export function getDeviceDisplayName(device: Pick<NoiseDiscoveredDevice, 'name' | 'localName'>): string {
  const candidates = [device.localName, device.name].map((n) => n?.trim()).filter((n): n is string => !!n && n.length > 0);
  return candidates[0] ?? 'Unknown BLE Device';
}

export function hasKnownName(device: Pick<NoiseDiscoveredDevice, 'name' | 'localName'>): boolean {
  return getDeviceDisplayName(device) !== 'Unknown BLE Device';
}

/**
 * A hint, not a guarantee: true only when the resolved display name
 * actually contains "noise" (case-insensitive). Deliberately does NOT
 * infer a match from manufacturer data or service UUIDs — this app doesn't
 * have a verified, documented Noise company ID or vendor service UUID to
 * match against, and guessing one would risk mislabeling someone else's
 * device as the user's watch.
 */
export function isLikelyNoiseDevice(device: Pick<NoiseDiscoveredDevice, 'name' | 'localName'>): boolean {
  return getDeviceDisplayName(device).toLowerCase().includes('noise');
}
