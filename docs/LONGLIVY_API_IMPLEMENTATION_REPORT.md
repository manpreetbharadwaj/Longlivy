> **Superseded (2026-10-08).** This report predates the live backend and documents routes that do not exist (`/login`, `/register`, `/me`, `/show/{id}`). See `API_INTEGRATION_STATUS.md`, `LONGLIVY_FINAL_AUDIT.md` and `BACKEND_API_REQUIREMENTS.txt` in the project root.

# LongLivy API Implementation Report

## 1. API Configuration

- **Base URL:** `https://longlivy.digitallhut.com/api/v1`
- **Client:** the existing centralized Axios client in `src/services/api/apiClient.ts`
- **Environment override:** `EXPO_PUBLIC_API_BASE_URL`
- **Mock switch:** `EXPO_PUBLIC_USE_MOCK_API=true` keeps the prototype's local repositories; set it to `false` to exercise the backend path.
- **Timeout:** `EXPO_PUBLIC_API_TIMEOUT_MS`, default 15 seconds.
- **Token/session storage:** `expo-secure-store`. The access token and a minimal user snapshot are stored separately; passwords are never persisted.
- **Authorization:** a stored access token is attached as `Authorization: Bearer <token>`. This is an implementation-ready assumption based on the documented token-oriented auth flow, but the live backend could not be reached far enough to confirm it.
- **Refresh/logout:** no refresh-token or server-logout endpoint is documented. The client does not invent either protocol. A protected 401 clears the local session.

The supplied Google Doc could not be fetched from this worker: its export and edit URLs returned HTTP 401. The endpoint list in the task was used as the contract, and all live results below come from direct requests to the supplied base URL.

## 2. Endpoint Status

Probe date: **2026-10-06**. Requests used empty validation payloads for non-destructive POST/PUT calls. DELETE used only the clearly nonexistent id `__longlivy_api_probe_nonexistent__`.

| Endpoint | Method | Implemented | Tested | HTTP Status | Result | Notes |
|---|---:|---:|---:|---:|---|---|
| `/register` | POST | Yes | Yes | 404 | BLOCKED | Backend route not found; no test account was created. |
| `/login` | POST | Yes | Yes | 404 | BLOCKED | Backend route not found. |
| `/me` | POST | Yes | Yes | 404 | BLOCKED | Actual reauthentication behavior cannot be determined. |
| `/goals` | GET | Yes | Yes | 404 | BLOCKED | Backend route not found. |
| `/goals` | POST | Yes | Yes | 404 | BLOCKED | No goal was created. |
| `/show/{goalId}` | GET | Yes | Yes | 404 | BLOCKED | Candidate documented detail route not found. |
| `/goals/{goalId}` | GET | Yes | Yes | 404 | BLOCKED | Alternate detail route also not found. |
| `/goals/{goalId}` | PUT | Yes | Yes | 404 | BLOCKED | Safe nonexistent id was used. |
| `/goals/{goalId}` | DELETE | Yes | Yes | 404 | BLOCKED | Safe nonexistent id was used; no existing data was deleted. |
| `/goals/{goalId}/progress` | GET | Yes | Yes | 404 | BLOCKED | Backend route not found. |
| `/goals/{goalId}/progress` | POST | Yes | Yes | 404 | BLOCKED | No progress was created. |
| `/streaks` | GET | Yes | Yes | 404 | BLOCKED | Backend route not found. |
| `/streaks/{type}` | GET | Yes | Yes | 404 | BLOCKED | No valid streak type could be discovered. |

The host itself redirects a request to the bare `/api/v1` path toward `/public/api/v1`, but each documented resource route still returned 404. No endpoint returned a usable 2xx response, validation response, auth response, or JSON schema.

## 3. Authentication Findings

### Implemented behavior

- `POST /login` and `POST /register` are routed through the existing auth repository and Axios client.
- Registration maps the app's fields to the documented wire names: `first_name`, `last_name`, `date_of_birth`, `height`, and `current_weight`.
- Optional `address` is forwarded only when the app supplies one. The current flow collects address after registration, so it is not invented or sent as a placeholder.
- Auth responses are parsed defensively and accept common `token`, `access_token`, `accessToken`, and user-envelope variants. Unsupported/malformed success bodies fail as a safe `malformed` API error.
- Login/register success persists the access token and user identity in SecureStore.
- Startup restoration uses the stored token plus user snapshot. It deliberately does **not** call `/me`, because `/me` requires email/password according to the supplied documentation and the app never persists passwords.
- A protected 401 clears local credentials and Redux auth state. There is no automatic refresh retry because no refresh endpoint is documented.

### `/me` conclusion

The actual behavior could not be established: `POST /me` returned 404 without reaching an application response. The implementation treats it as a credentialed reauthentication/profile-read operation only and does not use it for normal startup restoration.

## 4. Goals

Implemented a typed goals service and Redux thunks for list, create, both detail-route candidates, update, delete, list progress, and post progress. Goal response mapping accepts documented snake_case fields and common response envelopes without treating a malformed response as success.

The Goals screen now supports:

- loading state;
- backend/local empty state;
- normalized error state with retry;
- pull-to-refresh;
- `PUT /goals/{goalId}` for target and active changes.

The existing Meditation Goals screen now loads matching goals through the same goals slice. No new create/delete UI was invented because the existing app has no corresponding affordance.

## 5. Goal Progress

The API layer implements:

- `GET /goals/{goalId}/progress`;
- `POST /goals/{goalId}/progress` with exactly `date`, `value`, and `completed` on the wire.

The Redux slice exposes typed load and record thunks, but no existing LongLivy screen has a semantically correct manual goal-progress entry flow. Progress is therefore not displayed as backend data yet. The live route returned 404.

## 6. Streaks

The API layer implements `GET /streaks` and `GET /streaks/{type}` with envelope-tolerant parsing. The backend returned 404 for both probes, so valid `{type}` values could not be discovered and existing fasting/meditation streak displays remain local/device-derived.

## 7. Missing Backend APIs

The supplied documentation does not provide usable routes for:

- fasting plans, sessions, timers, history, or fasting statistics;
- nutrition foods, meals, calories, macros, barcode, AI/photo/voice logging;
- activity/workouts, manual activity, GPS, distance, or calories;
- meditation library, sessions, history, sounds, completion, or favorites;
- profile update/address persistence;
- notifications;
- logout;
- refresh tokens;
- password reset;
- email verification;
- statistics aggregates beyond any future goals/progress/streak data.

These features remain local/mock or device-derived. No fabricated server persistence was added.

## 8. Documentation Issues

1. The supplied route list documents HTTP 201 for GET requests. The client accepts Axios's normal 2xx range and does not hard-code 201.
2. `/show/{goalId}` is ambiguous in the document. Both `/show/{goalId}` and `/goals/{goalId}` are implemented as explicit candidates and both returned 404 on the live host.
3. Authentication response fields and authentication header/cookie behavior are not documented. The parser supports common access-token field names, but the live 404 prevented confirmation.
4. `/me` is described as reauthentication and requires email/password, which is incompatible with safe token-only startup restoration. The app does not use it at startup.
5. Goal request validation, response envelopes, date formats, units, and numeric types are not documented. The app sends ISO `YYYY-MM-DD` date strings and numeric height/weight/target/progress values, while accepting common snake_case response fields.
6. The Google Doc itself was not accessible from this worker because Google returned HTTP 401.

## 9. App Screens Connected to the API

- Auth repository path used by Sign In/Sign Up when `EXPO_PUBLIC_USE_MOCK_API=false`.
- `GoalsScreen` for list, refresh, target update, and active-state update.
- `MeditationGoalsScreen` for loading the backend-supported meditation goal records.
- Root auth/profile identity binding uses the user returned from successful auth responses; profile address and other health fields remain local because no profile endpoint is documented.

These bindings are implemented but cannot be marked live-working until the host exposes the documented routes.

## 10. Screens Still Using Local/Mock or Device Data

- `FastingHomeScreen`, `ActiveFastScreen`, fasting history/calendar/statistics: no fasting backend API is documented.
- Nutrition dashboard, meals, calorie calculations, macros, barcode, and AI entry screens: no nutrition endpoint is documented.
- Activity home, tracking, history, and manual activity: no activity endpoint is documented; device integrations remain device-derived.
- Meditation library, sessions, history, sounds, favorites, and session statistics: no matching backend endpoint is documented.
- General Statistics: currently aggregates local feature state; no statistics endpoint is documented.
- Profile address and editable health attributes: local storage; `/me` is not an update endpoint.
- Notifications, password reset, email verification, and logout: local/unsupported because no documented routes exist.

## 11. Backend Changes Required

### Issue: documented routes return 404

- **Current behavior:** every documented endpoint probed at `https://longlivy.digitallhut.com/api/v1` returned 404.
- **Expected behavior:** the documented routes should be deployed under the supplied base URL and return JSON responses.
- **Recommended fix:** deploy/route `/api/v1/*` on the host, or provide the authoritative API origin and route prefix.

### Issue: authentication contract incomplete

- **Current behavior:** no token or user response could be observed; refresh/logout are undocumented.
- **Expected behavior:** document the login/register response schema, bearer/cookie behavior, token lifetime, and session invalidation route.
- **Recommended fix:** provide an access-token response example and a documented refresh/logout contract, or explicitly state that tokens are non-refreshable and logout is client-only.

### Issue: `/me` cannot safely restore a session

- **Current behavior:** it requires email/password and returned 404 in testing.
- **Expected behavior:** a normal authenticated `GET /me` or `POST /me` should accept the bearer token and return the current user.
- **Recommended fix:** add a token-authenticated current-user endpoint, or document why credentials are required and how clients should restore sessions without storing passwords.

### Issue: goal contract is incomplete

- **Current behavior:** detail route, response envelope, validation rules, date format, units, and streak type values are unknown.
- **Expected behavior:** return examples for all goal and progress operations, including 2xx/4xx bodies.
- **Recommended fix:** publish request/response examples and validation rules for `goal_type`, `target_value`, dates, units, `active`, and progress `completed`.

## 12. Final Working Status

| Area | Status |
|---|---|
| Central API client/error handling | Implemented and type-checked |
| Authentication contract | Implemented, live backend blocked by 404 |
| Session restoration | Local token/user snapshot; live token validation unverified |
| Goals | Implemented, live backend blocked by 404 |
| Goal progress | Implemented, not UI-bound, live backend blocked by 404 |
| Streaks | Implemented as service only, live backend blocked by 404 |
| Fasting backend | Not available in supplied API |
| Nutrition backend | Not available in supplied API |
| Activity backend | Not available in supplied API |
| Meditation backend | Not available in supplied API |
| Statistics backend | Not available in supplied API |

This is not a 100% live integration: the supplied host exposed none of the documented routes during verification.
