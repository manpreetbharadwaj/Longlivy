import type { UnknownAction } from '@reduxjs/toolkit';

/** Actions after which nothing of the previous account may remain in memory. */
const SESSION_END = new Set(['auth/logout/fulfilled', 'auth/markSessionExpired']);

/**
 * Wraps the root reducer so the listed user-data slices return to their
 * initial state when the session ends. Without this, the next account signed
 * in on the same device briefly (or, for values it never reloads,
 * permanently) sees the previous account's data — e.g. its calorie target.
 */
export function resetOnSessionEnd<S extends object>(
  reducer: (state: S | Partial<S> | undefined, action: UnknownAction) => S,
  keys: (keyof S)[],
): (state: S | Partial<S> | undefined, action: UnknownAction) => S {
  return (state, action) => {
    if (state && SESSION_END.has(action.type)) {
      const cleared: Partial<S> = { ...state };
      for (const key of keys) delete cleared[key];
      return reducer(cleared, action);
    }
    return reducer(state, action);
  };
}
