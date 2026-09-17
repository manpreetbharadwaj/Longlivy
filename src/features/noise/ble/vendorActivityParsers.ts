/**
 * Decoders for proprietary (non-Bluetooth-SIG) characteristics whose byte
 * meaning was confirmed by correlating a captured HCI snoop log of the
 * official Noise app against ground-truth values read directly off the
 * watch face — never from public documentation, and never guessed. Kept
 * separate from standardGattParsers.ts, which is reserved for officially
 * documented Bluetooth SIG characteristics only.
 *
 * Steps — verified across three independent observations within a single
 * continuous BLE connection (deltas of +171 and +32 steps, both exact,
 * zero error): service 00000001-0000-1000-8000-00805f9b34fb, characteristic
 * 00000003-0000-1000-8000-00805f9b34fb (handle varies by device), a 5-byte
 * notification `1a 00 [value] 00 00` where `value` increases by exactly the
 * number of real steps taken. Critically, the absolute step count the watch
 * face displays (e.g. 544) equals `335 + value` in that test session, but
 * `335` does not appear anywhere in the captured BLE traffic — it is not
 * observable by the app, only knowable because the tester read it off the
 * watch face directly. So this can only be decoded as steps gained since
 * the watch first sent this message on the current connection, never as an
 * absolute daily total.
 */
export const VENDOR_ACTIVITY_SERVICE_UUID = '00000001-0000-1000-8000-00805f9b34fb';
export const VENDOR_STEPS_CHARACTERISTIC_UUID = '00000003-0000-1000-8000-00805f9b34fb';
export const VENDOR_ACTIVITY_WRITE_CHARACTERISTIC_UUID = '00000002-0000-1000-8000-00805f9b34fb';

/**
 * The exact byte sequence the official Noise app writes (as GATT "Write
 * Command", i.e. without-response) to the activity write characteristic
 * before the watch pushes its notification burst — copied verbatim from
 * multiple captured HCI logs, not invented. Without this trigger, the watch
 * never sends the `1a 00 [value] 00 00` steps notification at all (bare
 * reads of the notify characteristic just return its last cached value in
 * an unrelated 22-byte format).
 *
 * One command was originally excluded here as an unverified risk:
 * `ab 00 00 09 00 00 00 00 01 00 01 00 04 [4 bytes]` — that trailing 4-byte
 * value changed on every sync attempt across every capture. It was tested
 * empirically: sending the trigger sequence WITHOUT this command reproduces
 * only a short burst missing the steps notification, confirming this
 * command is required. Its leading 2 bytes (`6a 39` in every capture taken
 * within an ~13-hour window) are consistent with a big-endian Unix
 * timestamp in seconds — so it's now constructed from the phone's real
 * clock at write time, not copied from any specific capture. This is an
 * inference, not a verified-byte-for-byte replay like the rest of this
 * list; the real verifier is whether steps data actually starts appearing.
 */
const VENDOR_ACTIVITY_SYNC_TRIGGER_PREFIX_HEX = 'ab0000090000000001000100'; // 12 bytes, verified constant across every capture

export function buildActivitySyncTriggerHex(now: Date = new Date()): string[] {
  const unixSeconds = Math.floor(now.getTime() / 1000) >>> 0;
  const timestampCommandHex = `${VENDOR_ACTIVITY_SYNC_TRIGGER_PREFIX_HEX}04${unixSeconds.toString(16).padStart(8, '0')}`;

  return [
    'ab0000060000000001006c000101',
    timestampCommandHex,
    'ab0000050000000001001c0000',
    'ab0000050000000001001c0000',
    'ab0000090000000001000400041c9a4100',
    'ab000005000000000100560000',
    'ab000005000000000100590000',
  ];
}

/** Returns the raw delta byte (0-255) from a `1a 00 [value] 00 00` notification, or null if this isn't that message. */
export function parseStepsDeltaNotification(bytes: ArrayLike<number>): number | null {
  if (bytes.length !== 5) return null;
  if (bytes[0] !== 0x1a || bytes[1] !== 0x00 || bytes[3] !== 0x00 || bytes[4] !== 0x00) return null;
  return bytes[2];
}
