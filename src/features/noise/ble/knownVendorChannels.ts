/**
 * Vendor-specific characteristics whose EXISTENCE and role in the protocol
 * have been verified against a real captured HCI snoop log of the official
 * Noise app talking to this exact watch (service 0x0001, handles 0x2b/0x2e)
 * — the official app writes commands to 0x0002 and reads the responses as
 * notifications on 0x0003 every time it syncs. Their byte-level meaning
 * (which field is steps, heart rate, etc.) is NOT decoded yet; that needs a
 * second capture correlated against a known on-watch value. Deliberately
 * separate from standardGattParsers.ts's STANDARD_UUIDS, which is reserved
 * for Bluetooth-SIG documented characteristics only — these are proprietary
 * and the strings here are descriptive annotations, not parsers.
 */
export const KNOWN_VENDOR_CHANNEL_LABELS: Record<string, string> = {
  '00000002-0000-1000-8000-00805f9b34fb': 'Primary vendor data channel (write) — protocol not yet decoded',
  '00000003-0000-1000-8000-00805f9b34fb': 'Primary vendor data channel (notify) — protocol not yet decoded',
};

export function knownVendorChannelLabel(characteristicUUID: string): string | null {
  return KNOWN_VENDOR_CHANNEL_LABELS[characteristicUUID.toLowerCase()] ?? null;
}
