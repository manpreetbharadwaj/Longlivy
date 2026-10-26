import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localIsoWithOffset } from '../src/utils/date/localIsoWithOffset';

const ZONES: Record<string, string> = {
  'Asia/Kolkata': '+05:30',
  UTC: '+00:00',
  'Asia/Kathmandu': '+05:45',
  'America/St_Johns': '-02:30',
  'America/New_York': '-04:00',
  'Pacific/Chatham': '+13:45',
};

for (const [zone, offset] of Object.entries(ZONES)) {
  test(`${zone}: keeps the instant, the local day and the offset`, () => {
    process.env.TZ = zone;
    // 23:30 local on 2026-10-19 - the late-evening case that used to move to the next day.
    const late = new Date(2026, 9, 19, 23, 30, 5);
    const value = localIsoWithOffset(late);
    assert.equal(value, `2026-10-19T23:30:05${offset}`);
    assert.equal(Date.parse(value), late.getTime());
  });
}

test('midnight stays on its own day', () => {
  process.env.TZ = 'Asia/Kolkata';
  const midnight = new Date(2026, 9, 20, 0, 0, 0);
  assert.equal(localIsoWithOffset(midnight), '2026-10-20T00:00:00+05:30');
  assert.equal(Date.parse(localIsoWithOffset(midnight)), midnight.getTime());
});
