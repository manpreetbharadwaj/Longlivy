export type SessionEndStatus = 'completed' | 'ended_prematurely';

export interface SessionFinisherDeps {
  /** Settles with the persisted session id — immediately once known, otherwise when the start request settles. `null` means no record was created. */
  resolveSessionId: () => Promise<string | null>;
  stopAudio: () => void;
  recordEvent: (sessionId: string, type: 'completed' | 'stopped') => Promise<unknown>;
  completeSession: (sessionId: string, status: SessionEndStatus) => Promise<unknown>;
  leave: () => void;
}

/**
 * Builds the single exit path for a meditation session — natural completion,
 * "End session", the Android back button and the completion timer all funnel
 * into the function this returns.
 *
 * - Runs at most once, so two exit triggers racing each other can't record the
 *   session twice or navigate twice.
 * - Waits for the start request when the user leaves before it has resolved,
 *   so that session is closed instead of being left 'started' forever.
 * - Always leaves, even if persisting the session throws, so a failed write
 *   can never trap the user on the Player.
 */
export function createSessionFinisher(deps: SessionFinisherDeps): (status: SessionEndStatus) => Promise<void> {
  let started = false;
  return async (status) => {
    if (started) return;
    started = true;
    deps.stopAudio();
    try {
      const sessionId = await deps.resolveSessionId();
      if (sessionId) {
        await deps.recordEvent(sessionId, status === 'completed' ? 'completed' : 'stopped');
        await deps.completeSession(sessionId, status);
      }
    } finally {
      deps.leave();
    }
  };
}
