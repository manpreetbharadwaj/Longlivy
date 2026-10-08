# LongLivy — Meditation Backend Contract

Content, audio streaming, playback progress, favorites and sessions.
Checked against the API document (`docs/API_DOC.txt`, sections MEDITATION:
CONTENT / HOME AND STATS / SESSIONS / GOALS / REMINDERS) and the live server
`https://longlivy.digitallhut.com/api/v1` on 2026-10-08. The document lists
routes and request fields only. It has **no response schema and no audio
fields**, so the content shape in §3 is a proposal.

**Legend:** ✅ EXISTS (live, verified) · 🔧 EXISTS, NEEDS CHANGE · 🆕 PROPOSED (does not exist)

## 1. Readiness summary

| Area | State |
|---|---|
| Sessions (start / pause / resume / complete / cancel / history) | ✅ Working, integrated, verified end-to-end |
| Reminders (CRUD) | ✅ Working, integrated, verified end-to-end |
| Favorites | ✅ `/favorites` with `type: "meditation"` — integrated; unusable until content exists (`"The selected item is not available."`) |
| Content catalog | 🔧 `GET /meditation` is **live but empty**; `GET /meditation/{id}` returns 404 for every id |
| Audio | **Not available.** No content record exists, so no audio field could be observed |
| Categories | 🔧 `GET /meditation/categories` is live but empty |
| Playback progress / resume | 🔧 Not available; proposed as new fields on the existing `PUT /meditation/sessions/{session}` |
| Home / statistics | ✅ `GET /meditation/home` (streak) and `GET /meditation/stats` (totals) are **integrated** |

**Is meditation audio backend-driven today? No.** The app is ready for it
(see §8), but the server has no content. Until it does, the app plays its
**bundled catalog** (13 tracks + 4 ambient beds in `assets/sounds/`, rows
marked `contentSource: 'bundled'`). In API mode these are **labelled as
included with the app** on Meditation Home ("These sessions are included with
the app. Your progress is saved to your account.") and on each item's details
page ("Included with the app"), so they are never presented as backend
content. If the catalog fails to load, Meditation Home shows an error with
Retry. The bundled assets must stay in the app until the checklist in §9 passes.

## 2. Answers to the audio questions

| # | Question | Answer |
|---|---|---|
| 1 | How will the audio URL arrive? | In the content item, as `audio.url` (§3). The app also accepts `audio_url` / `stream_url` / `file_url` for compatibility, but `audio.url` is the contract. Only `https://` URLs are accepted. |
| 2 | Where is audio hosted? | **Backend decision, not made yet.** Recommended: object storage (S3 / Cloudflare R2 / Bunny Storage) behind a CDN. Hostinger shared hosting (current server) should not serve audio files directly. |
| 3 | Public or signed URL? | Either works. Recommended: **signed CDN URLs** if any content will be premium, otherwise public immutable URLs. Signed URLs must carry `audio.expires_at`. |
| 4 | Expired URLs? | **Implemented in the app:** before playback, if `audio.expires_at` is within 5 minutes, the player re-fetches the item with the existing ✅ `GET /meditation/{meditation}` (`useFreshAudioUrl`) and never hands an expired URL to the player. No new endpoint is needed. TTL must be ≥ session length + 30 min (min. 2 h). Mid-stream 403 recovery is not implemented. |
| 5 | Playback duration and progress? | Duration: `duration_seconds` + `audio.duration_seconds`. The app's session timer is authoritative and loops shorter tracks (`useMeditationAudioSession`). Progress: 🔧 extend the existing `PUT /meditation/sessions/{session}` with position fields (§5); sent every 15 s and on pause/background once available. |
| 6 | Images/thumbnails from the backend? | Yes — `thumbnail_url` (https, ≥ 600×600, JPEG/WebP). **Implemented:** the details banner shows `thumbnailUrl` when present and falls back to the generated art otherwise. |
| 7 | Language-specific audio? | One content item, one audio file per language (`meditation_audio` table, unique `meditation_id + language`). The server picks by `?language=` (app sends its UI language: `en`/`de`), falling back to `en`; the item's `language` field says which one was returned. |
| 8 | Saving completed sessions? | ✅ Already works: `POST /meditation/sessions` → `/pause` / `/resume` → `/complete` (optional `ended_at`, verified) or `/cancel`. 🔧 `/complete` should also accept the client's measured `active_seconds` / `paused_seconds` (§5). |
| 9 | Resume interrupted playback? | ✅ `GET /meditation/sessions/active` returns the open session. 🔧 It needs `position_seconds` (from the PUT progress fields in §5) for a true resume. Today the app cancels a stale open session when a new one starts (otherwise the server's one-active-session rule blocks every new start). |
| 10 | Dedicated streaming endpoint? | **No.** The CDN streams (HTTP range requests); the API only issues URLs through the existing content endpoints. Serving audio through Laravel would tie up PHP workers for the whole session. |

## 3. Content

### 🔧 `GET /meditation` — list (exists, empty)

Documented query: `type` (guided|free|breathing|individual) · `category` · `language` · `max_duration` · `q`. Proposed additions: `page` · `per_page`.

```json
{
  "success": true,
  "message": "Meditations retrieved successfully.",
  "data": {
    "meditations": [ { "...": "Meditation, see below" } ],
    "meta": { "current_page": 1, "per_page": 50, "total": 23, "last_page": 1 }
  }
}
```

### 🔧 `GET /meditation/{id}` — single (exists, 404 for all ids)

```json
{ "success": true, "message": "Meditation retrieved successfully.", "data": { "meditation": { "...": "Meditation" } } }
```

### Meditation object (required unless marked nullable)

Compared with the proposal in the brief: same shape, with `category`
as an object (the app needs the slug *and* a display name), `audio.mime_type`
/ `size_bytes` added for the player, and `availability` added so items can be
listed before their audio is ready.

```json
{
  "id": 12,
  "title": "Deep Relaxation",
  "description": "Full-body relaxation to release physical tension.",
  "type": "guided",
  "category": { "id": 3, "slug": "relaxation", "name": "Relaxation" },
  "sound_category": null,
  "language": "en",
  "duration_seconds": 900,
  "thumbnail_url": "https://cdn.longlivy.app/meditations/12/thumb@2x.jpg",
  "audio": {
    "url": "https://cdn.longlivy.app/meditations/12/en/audio.m4a?Expires=1728410400&Signature=...",
    "format": "m4a",
    "mime_type": "audio/mp4",
    "bitrate_kbps": 128,
    "duration_seconds": 900,
    "size_bytes": 14400000,
    "is_streamable": true,
    "expires_at": "2026-10-08T18:00:00+00:00"
  },
  "availability": "available",
  "is_premium": false,
  "is_favorite": false,
  "version": "1.0",
  "updated_at": "2026-10-01T09:00:00+00:00"
}
```

| Field | Type | Notes |
|---|---|---|
| `type` | `guided` \| `free` \| `breathing` | Session `type` also allows `individual` (custom templates) |
| `category.slug` | `morning` `mindfulness` `energy` `focus` `relaxation` `calm` `stress_relief` `sleep` | The app's topic taxonomy (`MEDITATION_TOPICS`) |
| `sound_category` | nullable `meditation_music` \| `ambient` \| `nature` | Only for `type: free` |
| `audio` | nullable | `null` only when `availability: "coming_soon"`. **The app never opens the player for an item without an https `audio.url`.** |
| `audio.expires_at` | nullable ISO | `null` = public URL |
| `is_favorite` | boolean | From `/favorites` for the current user |

Encoding guidance: AAC-LC in `.m4a` (or MP3), 128 kbps stereo / 64–96 kbps for
voice-only, 44.1 kHz, `-14 LUFS` integrated loudness, `Content-Type` and
`Accept-Ranges: bytes` set on the CDN, CORS not needed (native player).

### 🔧 `GET /meditation/categories` (exists, empty)

```json
{ "success": true, "message": "Meditation categories retrieved successfully.",
  "data": { "categories": [ { "id": 3, "slug": "relaxation", "name": "Relaxation", "sort_order": 5, "meditation_count": 4 } ] } }
```

### URL refresh — uses the existing `GET /meditation/{meditation}`

No separate audio endpoint (previously proposed, now withdrawn). The item's
`audio.url` is re-issued whenever the item is fetched.

## 4. Sessions ✅ (exist, verified)

| Method | Endpoint | Body | Result |
|---|---|---|---|
| GET | `/meditation/sessions` | — | `data.sessions[]` |
| GET | `/meditation/sessions/active` | — | `data.session` or `null` |
| POST | `/meditation/sessions` | `{ "type": "guided", "planned_minutes": 15, "meditation_id": 12 }` | 201 `data.session`, `status: "active"` |
| POST | `/meditation/sessions/{id}/pause` | `{}` | `status: "paused"` |
| POST | `/meditation/sessions/{id}/resume` | `{}` | `status: "active"` |
| POST | `/meditation/sessions/{id}/complete` | `{}` or `{ "ended_at": "…" }` | `status: "completed"`, `actual_minutes` (an `ended_at` 4 min after start stored 4) |
| POST | `/meditation/sessions/{id}/cancel` | `{}` | `status: "cancelled"` |
| GET · PUT · DELETE | `/meditation/sessions/{id}` | PUT: `{ "notes": "…" }` | ✅ all verified; not used by the app |

Verified rules: `type` ∈ guided|free|breathing|individual (required unless
`meditation_id` is sent) · `planned_minutes` integer ≥ 1 · optional
`started_at` (must not be in the future) · `meditation_id` must be an integer (a bundled id like `med_2` is
not sent) · **one active session per user** (422 `"A meditation session is
already in progress."`) · another user's session → 403.

Session object (live):

```json
{ "id": 1, "meditation": null, "type": "guided", "status": "completed", "is_running": false,
  "planned_minutes": 10, "actual_minutes": 1, "started_at": "2026-10-08T11:26:00.000000Z",
  "ended_at": "2026-10-08T11:26:11.000000Z", "paused_at": null, "date": "2026-10-08",
  "elapsed_seconds": 10, "progress_percent": 10, "notes": null,
  "created_at": "...", "updated_at": "..." }
```

How the app uses them (`src/features/meditation/repository/ApiMeditationRepository.ts`):

- Start → `POST /meditation/sessions`. On "already in progress" it cancels the stale server session and retries.
- Pause/Resume → the matching action. Other lifecycle events (backgrounded, interrupted…) stay in a device-side event log.
- Finish → `/complete` for a full session or an early exit with ≥ 60 s of practice (`MIN_STREAK_ACTIVE_SECONDS`); otherwise `/cancel`.
- History → `GET /meditation/sessions` (completed + cancelled). Title, template and client-measured durations are kept in a device overlay because the server has no fields for them (see §5).

## 5. Session changes and progress

### 🔧 `POST /meditation/sessions/{id}/complete` — accept client durations

```json
{ "active_seconds": 610, "paused_seconds": 5, "ended_at": "2026-10-08T11:36:12+00:00" }
```
Today the body is ignored and `actual_minutes` comes from server timestamps (a
10-second session was stored as 1 minute). Store `active_seconds` /
`paused_seconds`; `actual_minutes = floor(active_seconds / 60)`.

Also add to the session object: `title` (snapshot of the content title, or the
client-supplied title for unguided/custom sessions — accept `"title"` on POST)
and `template_id` (nullable).

### 🔧 `PUT /meditation/sessions/{session}` — add progress fields (existing route accepts only `notes`)

```json
{ "position_seconds": 312, "active_seconds": 300, "paused_seconds": 45,
  "client_timestamp": "2026-10-08T11:31:12+00:00" }
```
→ 200 with the session including `position_seconds`, `active_seconds`,
`paused_seconds`. Ignore out-of-order updates (older `client_timestamp`). 422 if
the session is not running. Called every 15 s while playing and on
pause/background. `GET /meditation/sessions/active` must include these fields
so a reinstalled/other device can resume.

## 6. Favorites ✅ (existing `/favorites` — no new meditation endpoint needed)

| Method | Endpoint | Body |
|---|---|---|
| GET | `/favorites` | — → `data.favorites[]` with `type`, `favoritable_id`, `target` |
| POST | `/favorites` | `{ "type": "meditation", "id": 12 }` |
| DELETE | `/favorites/{favoriteId}` | — |

Verified: `type` accepts `food`, `meal`, `meditation`; meditation currently
fails only because no meditation exists. Favorites of bundled items are kept on
the device until server content exists. Please also return `is_favorite` on
content items (§3) so the list doesn't need a second request.

## 7. Goals, reminders, statistics

- **Goals ✅** `GET/POST /meditation/goals` work; the same records appear in
  `GET /goals` as `goal_type: "meditation"` with unit `minutes`/`sessions`. The app
  reads them through `/goals` and maps them to `meditation_minutes` /
  `meditation_sessions`.
- **Reminders ✅** `GET/POST /meditation/reminders`, `PUT/DELETE /meditation/reminders/{id}`.
  `days_of_week` must be a comma string (`"1,3,5"`); `time` comes back as `HH:mm`
  or `HH:mm:ss` (normalised by the app). OS notification ids are stored on the
  device only.
- **Home and statistics ✅ integrated** `GET /meditation/home` supplies the streak
  on Meditation Home and the dashboard; `GET /meditation/stats` supplies the
  totals on Meditation Statistics (completed sessions only — cancelled exits
  under a minute are no longer counted). `short_meditations` and `by_category`
  stay empty until content exists.

## 8. What is still local (and why)

| Data | Where | Backend item |
|---|---|---|
| Content catalog + audio | Bundled (`src/mock/meditationSeed.ts`, `assets/sounds/`) while server is empty | §3 |
| Custom meditations (templates) | Device, per user | Requirements #10 |
| Breathing schemes | Bundled | Requirements #11 (`breathing_pattern` fields on type=breathing items) |
| Session title / template / client durations / event log | Device overlay keyed by server session id | §5 |
| Favorites of bundled items | Device, per user | resolves itself once content is on the server |

Frontend integration points in place:
`src/services/api/meditationApi.ts` (`mapMeditationContent`, `getContent`),
`src/features/meditation/meditationAudio.ts` (`resolveMeditationAudioSource`
streams any `https://` URL), `src/features/meditation/hooks/useFreshAudioUrl.ts`
(signed-URL refresh), `MeditationPlayerScreen` (prefers the server URL over the
bundled `audioReference`), `MeditationDetailsScreen` (server thumbnail, bundled
label). Still to do once the backend supports it: the progress heartbeat
(§5) and mid-stream 403 recovery. All of this is unverified against real
content because the server catalog is empty.

## 9. Go-live checklist before removing bundled audio

1. `GET /meditation` returns published items with https `audio.url` for both `en` and `de`.
2. A guided, a free (music) and a breathing item play to completion on iOS and Android, including lock-screen/background playback.
3. Seeking works (CDN answers range requests with 206).
4. An expired signed URL is refreshed through `GET /meditation/{id}/audio`.
5. A session started from server content stores `meditation_id`, and favorites work for it.
6. Then remove the bundled fallback in `ApiMeditationRepository.getPublishedContent` and the MP3s in `assets/sounds/` that only back catalog rows (keep the ambient beds if they stay a local feature).
