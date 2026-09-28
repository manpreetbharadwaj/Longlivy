import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createSessionFinisher, SessionFinisherDeps } from '../src/features/meditation/services/meditationSessionFinisher';

function harness(overrides: Partial<SessionFinisherDeps> = {}) {
  const calls: string[] = [];
  const deps: SessionFinisherDeps = {
    resolveSessionId: async () => 'session_1',
    stopAudio: () => calls.push('stopAudio'),
    recordEvent: async (id, type) => {
      calls.push(`event:${id}:${type}`);
    },
    completeSession: async (id, status) => {
      calls.push(`complete:${id}:${status}`);
    },
    leave: () => calls.push('leave'),
    ...overrides,
  };
  return { calls, finish: createSessionFinisher(deps) };
}

test('early exit stops audio, records "stopped", completes the session, then leaves - in that order', async () => {
  const { calls, finish } = harness();
  await finish('ended_prematurely');
  assert.deepEqual(calls, ['stopAudio', 'event:session_1:stopped', 'complete:session_1:ended_prematurely', 'leave']);
});

test('natural completion records "completed"', async () => {
  const { calls, finish } = harness();
  await finish('completed');
  assert.deepEqual(calls, ['stopAudio', 'event:session_1:completed', 'complete:session_1:completed', 'leave']);
});

test('two exit triggers racing each other only exit once', async () => {
  const { calls, finish } = harness();
  await Promise.all([finish('completed'), finish('ended_prematurely'), finish('ended_prematurely')]);
  assert.equal(calls.filter((c) => c === 'stopAudio').length, 1);
  assert.equal(calls.filter((c) => c === 'leave').length, 1);
  assert.equal(calls.filter((c) => c.startsWith('complete:')).length, 1);
});

test('leaving before the start request resolves still closes that session instead of orphaning it', async () => {
  let resolveStart: (id: string | null) => void = () => {};
  const startRequest = new Promise<string | null>((resolve) => {
    resolveStart = resolve;
  });
  const { calls, finish } = harness({ resolveSessionId: () => startRequest });

  const finishing = finish('ended_prematurely');
  await Promise.resolve();
  assert.deepEqual(calls, ['stopAudio'], 'audio stops immediately, before the session id is known');

  resolveStart('session_late');
  await finishing;
  assert.deepEqual(calls, ['stopAudio', 'event:session_late:stopped', 'complete:session_late:ended_prematurely', 'leave']);
});

test('a session that never started just leaves - nothing to record', async () => {
  const { calls, finish } = harness({ resolveSessionId: async () => null });
  await finish('ended_prematurely');
  assert.deepEqual(calls, ['stopAudio', 'leave']);
});

test('a failing save still leaves the screen (and does not swallow the error)', async () => {
  const { calls, finish } = harness({
    completeSession: async () => {
      throw new Error('disk full');
    },
  });
  await assert.rejects(finish('completed'), /disk full/);
  assert.equal(calls[calls.length - 1], 'leave');
});

// The crash: expo-audio's `useAudioPlayer` releases its native player during
// unmount, before any effect cleanup declared after it runs. A cleanup that
// calls `player.<anything>()` therefore touches a released native object and
// throws ("Unable to find the native shared object..."), which took the whole
// Player screen down every time a session ended. Behaviour can't be exercised
// here (no React renderer / native audio in this project's test setup), so
// this guards the source pattern; the runtime fix was verified on the iOS
// simulator.
test('audio hooks never touch the player from an effect cleanup', () => {
  const hooksDir = join(__dirname, '..', '..', 'src', 'features', 'meditation', 'hooks');
  for (const file of ['useMeditationAmbientAudio.ts', 'useMeditationAudioSession.ts']) {
    const source = readFileSync(join(hooksDir, file), 'utf8');
    const cleanups = [...source.matchAll(/return\s*\(\)\s*=>\s*(\{[^}]*\}|[^;\n]*)/g)].map((match) => match[1]);
    for (const body of cleanups) {
      assert.ok(!/\bplayer\b/.test(body), `${file}: an effect cleanup references \`player\`: ${body.trim()}`);
    }
  }
});
