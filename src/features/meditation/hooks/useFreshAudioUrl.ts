import { useEffect, useState } from 'react';
import { Meditation } from '../models';
import { meditationApi } from '@/services/api/meditationApi';

const REFRESH_MARGIN_MS = 5 * 60_000;

function expiresSoon(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const at = new Date(expiresAt).getTime();
  return Number.isFinite(at) && at - Date.now() < REFRESH_MARGIN_MS;
}

/**
 * A server meditation's audio URL, re-fetched (GET /meditation/{id}) when its
 * signed URL expires within five minutes. Returns undefined while a refresh
 * is in flight so an expired URL is never handed to the player. Bundled
 * content (no `audioUrl`) passes through untouched.
 *
 * Unverified against the live API: the server catalog has no content yet.
 */
export function useFreshAudioUrl(meditation: Meditation | undefined): string | undefined {
  const stale = !!meditation?.audioUrl && expiresSoon(meditation.audioExpiresAt);
  const [fresh, setFresh] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!meditation || !stale) return;
    let cancelled = false;
    meditationApi
      .getContent(meditation.id)
      .then((latest) => {
        if (!cancelled) setFresh(latest.audioUrl);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [meditation, stale]);

  if (!meditation?.audioUrl) return undefined;
  return stale ? fresh : meditation.audioUrl;
}
