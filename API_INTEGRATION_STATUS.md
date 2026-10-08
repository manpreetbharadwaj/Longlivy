# LongLivy — API Integration Status

Backend: `https://longlivy.digitallhut.com/api/v1` (Laravel + Sanctum bearer tokens)
Contract: `docs/API_DOC.txt` (transcription of the Google Doc, **84 endpoints**)
Verified: 2026-10-08 against the live server, using throwaway test accounts
(`claude.audit+20261008@example.com`, `claude.audit.b+20261008@example.com`) and
only records those accounts created.

## How "verified" was established

1. **Live harness.** The app's real `src/services/api/*` and
   `src/features/*/repository/Api*Repository.ts` code is bundled for Node, with
   SecureStore and AsyncStorage swapped for in-memory stand-ins, and run against
   the server. Result: **47 of 47 checks pass** (44 end-to-end, 3 token-expiry; re-run 2026-10-08 after the second round of changes).
4. **UI flows in the iOS simulator** (Maestro): login, wrong password, restart persistence, all tabs, logging a food, starting and ending a fast, logout, switching accounts with no data leak, address step.
2. **Raw requests** (curl) for every other documented endpoint.
3. **Cross-account test.** User B tried to read, update or delete 13 of user A's
   records by id and got 403 every time. B's lists never contained A's data.

## Status legend

| Status | Meaning |
|---|---|
| **INTEGRATED & VERIFIED** | Called by the app; app code verified against the live API |
| **INTEGRATED (raw-verified)** | Called by the app; endpoint verified with raw requests, not through the harness |
| **AVAILABLE BUT NOT INTEGRATED** | Works on the server; the app doesn't call it yet |
| **IMPLEMENTED BUT FAILING** | Route exists but doesn't do what the doc says |
| **BACKEND NOT AVAILABLE** | App needs it; the doc and server have no route (see `BACKEND_API_REQUIREMENTS.txt`) |

## Response conventions (verified)

- Success: `{ "success": true, "message": "...", "data": { "<resource>": ... } }`. The doc has no response schemas; all mappers were written from real bodies.
- Validation: 422 `{ "message", "errors": { field: [..] } }` · 401 `{"message":"Unauthenticated."}` · another user's record: 403.
- **Decimals are strings** (`"weight": "72.50"`). Parsed by `num()` in `src/services/api/laravel.ts`.
- `date_of_birth` is `"YYYY-MM-DD"` on GET and `"…T00:00:00.000000Z"` after PUT. Reminder `time` is `HH:mm` or `HH:mm:ss`. Both are normalized in the app.
- No `page` parameter anywhere; some lists take `from` / `to` / `limit`.
- **Laravel debug mode is on.** Every framework error returns a stack trace and server paths. This is a critical production blocker.

## Endpoint table — all 84 documented endpoints

### Authentication (4) — `src/services/api/authApi.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/auth/register` | POST | Register | INTEGRATED & VERIFIED | App sends `password_confirmation` (required) and the device `timezone`. Names come back under `user.profile`. |
| `/auth/login` | POST | Login | INTEGRATED & VERIFIED | Wrong password → "Invalid email or password." |
| `/auth/me` | GET | Session restore on launch | INTEGRATED & VERIFIED | Offline → stored identity; rejected token → signed out |
| `/auth/logout` | POST | Profile, Data management | INTEGRATED & VERIFIED | Token revoked (`/auth/me` → 401 afterwards) |

### Goals (7) — `src/services/api/goalsApi.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/goals` | GET | Goals, MeditationGoals, NutritionGoals | INTEGRATED & VERIFIED | `target` nested `{value, unit}`; `goal_type: meditation` → app `meditation_minutes`/`_sessions`; `nutrition_*` → nutrition targets |
| `/goals` | POST | NutritionGoals (missing target) | INTEGRATED (raw-verified) | `period` must be `day|week|month` |
| `/goals/{goal}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/goals/{goal}` | PUT | Goals, NutritionGoals | INTEGRATED & VERIFIED | Manual edit keeps `source: longlivy_calculated` (backend bug) |
| `/goals/{goal}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works; no delete UI |
| `/goals/{goal}/progress` | GET | — | AVAILABLE BUT NOT INTEGRATED | Parser verified |
| `/goals/{goal}/progress` | POST | — | AVAILABLE BUT NOT INTEGRATED | Works |

### Streaks (2)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/streaks` | GET | Dashboard streak chips, Fasting/Meditation statistics | INTEGRATED & VERIFIED | Server streaks replace on-device counting (`insightsSlice`) |
| `/streaks/{type}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Not needed: `/streaks` returns both types in one call |

### Fasting (8) — `fastingApi.ts`, `ApiFastingRepository.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/fasting` | GET | History, Calendar, Statistics | INTEGRATED & VERIFIED | `status`, `from`, `to` filters exist (unused) |
| `/fasting` | POST | FastingHome → start | INTEGRATED & VERIFIED | `planned_hours` integer 1–48; one running fast enforced (422 → "already active"); `fasting_type` not validated |
| `/fasting/active` | GET | FastingHome, Dashboard | INTEGRATED & VERIFIED | |
| `/fasting/summary` | GET | FastingStatistics, FastingHome stats | INTEGRATED & VERIFIED | Totals, average, longest and streak from the server; shortest is still computed on the device |
| `/fasting/{fasting}` | GET | FastSummary | INTEGRATED & VERIFIED | |
| `/fasting/{fasting}` | PUT | Extend / edit | INTEGRATED & VERIFIED | Per the doc, `started_at` isn't updatable, so the app re-creates the fast to move its start |
| `/fasting/{fasting}/end` | POST | End / auto-complete | INTEGRATED & VERIFIED | `ended_at` honored; server sets `completed` or `failed` |
| `/fasting/{fasting}` | DELETE | Cancel fast | INTEGRATED & VERIFIED | Used for cancel (there is no cancel route) |

### Profile (2) — `profileApi.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/profile` | GET | — | AVAILABLE BUT NOT INTEGRATED | Same body as `/auth/me`, which the app uses |
| `/profile` | PUT | EditProfile, Address step | INTEGRATED & VERIFIED | Activity levels mapped `active→high`, `very_active→very_high`. `gender` is not validated server-side. |

### Weight (6) — `weightApi.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/weight-logs` | GET | WeightCard, Statistics, History | INTEGRATED & VERIFIED | `lb` converted to kg; `from`/`to`/`limit` exist |
| `/weight-logs` | POST | EnterWeight | INTEGRATED & VERIFIED | |
| `/weight-logs/latest` | GET | WeightCard | AVAILABLE BUT NOT INTEGRATED | Works |
| `/weight-logs/{weightLog}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/weight-logs/{weightLog}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | Works; no edit UI |
| `/weight-logs/{weightLog}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works; no delete UI |

### Foods (7) — `nutritionApi.ts`, `ApiNutritionRepository.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/foods` | GET | FoodSearch | INTEGRATED & VERIFIED | `q` works. Returns **only the user's own foods**; there is no shared catalog (the doc implies one via `mine`) |
| `/foods` | POST | MyFoods | INTEGRATED (raw-verified) | Doc field is `category_id`; free-text `category` is dropped |
| `/food-categories` | GET | — | AVAILABLE BUT NOT INTEGRATED | Returns `[]` |
| `/foods/barcode/{barcode}` | GET | BarcodeScanner | **IMPLEMENTED BUT FAILING** | Doc: "201 created from database". Live: only user-created barcodes resolve. 5 real EANs (Nutella 3017620422003, Twix 5000159484695, …) → 404. |
| `/foods/{food}` | GET | AddFood | INTEGRATED (raw-verified) | |
| `/foods/{food}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/foods/{food}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works |

### Meals (8)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meals` | GET | NutritionDashboard, Dashboard | INTEGRATED & VERIFIED | `date` filter |
| `/meals` | POST | AddFood (first item of day/type) | INTEGRATED & VERIFIED | **`logged_at` offset is dropped** (19:00+02:00 stored as 19:00Z), so the app sends local wall-clock time |
| `/meals/{meal}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meals/{meal}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meals/{meal}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meals/{meal}/items` | POST | AddFood | INTEGRATED & VERIFIED | Free-form items supported |
| `/meals/{meal}/items/{item}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | Changing a free-form item's `quantity` doesn't rescale its nutrients |
| `/meals/{meal}/items/{item}` | DELETE | MealDetails | INTEGRATED & VERIFIED | |

### Nutrition day / log / recognition (3)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/nutrition/day` | GET | NutritionDashboard | AVAILABLE BUT NOT INTEGRATED | Intake plus per-nutrient target, status and remaining |
| `/nutrition/log` | POST | — | AVAILABLE BUT NOT INTEGRATED | Works; the app uses `/meals` + `/items` (same effect) |
| `/nutrition/recognize` | POST | — | **IMPLEMENTED BUT FAILING** | `provider: "stub"`; `items` always empty. Photo entry is **hidden** in the app (`config/features.ts`); text and voice entry use an on-device matcher that never invents foods |

### Recipes (5)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/recipes` | GET | MyRecipes | INTEGRATED (raw-verified) | |
| `/recipes` | POST | CreateRecipe | INTEGRATED & VERIFIED | Server ids and free-form ingredients |
| `/recipes/{recipe}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/recipes/{recipe}` | PUT | CreateRecipe (edit) | INTEGRATED (raw-verified) | |
| `/recipes/{recipe}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works; no delete UI |

### Favorites (3)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/favorites` | GET | AddFood, Favorites, MeditationFavorites | INTEGRATED & VERIFIED | Optional `type` filter |
| `/favorites` | POST | toggles | INTEGRATED & VERIFIED | `food|meal|meditation`; meditation rejected while the catalog is empty |
| `/favorites/{favorite}` | DELETE | toggles | INTEGRATED & VERIFIED | |

### Energy (3)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/energy/balance` | GET | Dashboard pulse and calorie cards | INTEGRATED & VERIFIED | BMR, everyday activity and the calorie goal come from the server; intake stays derived from loaded server meals so it updates instantly |
| `/energy/bmr` | GET | — | AVAILABLE BUT NOT INTEGRATED | Mifflin-St Jeor; lists `missing_inputs` |
| `/energy/targets/calculate` | POST | NutritionGoals, Dashboard, profile save | INTEGRATED & VERIFIED | Creates or updates the `nutrition_*` goals. **Recalculating overwrites manual targets** (backend bug). |

### Meditation content (3) — `meditationApi.ts`, `ApiMeditationRepository.ts`

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meditation` | GET | MeditationHome, Categories | INTEGRATED & VERIFIED (**content empty**) | The endpoint works but returns no items, so the app falls back to its bundled catalog |
| `/meditation/{meditation}` | GET | Player (signed-URL refresh) | INTEGRATED, **unverifiable** | `useFreshAudioUrl` re-fetches an item whose audio URL expires within 5 min; 404 for every id today because no content exists |
| `/meditation/categories` | GET | — | AVAILABLE BUT NOT INTEGRATED | Returns `[]` |

### Meditation home and stats (2)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meditation/home` | GET | MeditationHome | INTEGRATED & VERIFIED | Streak from the server |
| `/meditation/stats` | GET | MeditationStatistics | INTEGRATED & VERIFIED | Totals (completed sessions only) from the server |

### Meditation sessions (10)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meditation/sessions` | GET | History, Statistics | INTEGRATED & VERIFIED | |
| `/meditation/sessions/active` | GET | stale-session recovery | INTEGRATED & VERIFIED | |
| `/meditation/sessions` | POST | Player start | INTEGRATED & VERIFIED | One active session per user; the app cancels a stale one and retries |
| `/meditation/sessions/{session}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/sessions/{session}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | `notes` only; works |
| `/meditation/sessions/{session}/pause` | POST | Player | INTEGRATED & VERIFIED | |
| `/meditation/sessions/{session}/resume` | POST | Player | INTEGRATED & VERIFIED | |
| `/meditation/sessions/{session}/complete` | POST | Player | INTEGRATED & VERIFIED | Optional `ended_at` verified (stores the true duration) |
| `/meditation/sessions/{session}/cancel` | POST | Player (< 60 s) | INTEGRATED & VERIFIED | |
| `/meditation/sessions/{session}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works |

### Meditation goals (7)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meditation/goals` | GET | MeditationGoals (reads via `/goals`) | AVAILABLE BUT NOT INTEGRATED | Same records appear in `/goals` |
| `/meditation/goals` | POST | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/goals/{goal}` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/goals/{goal}` | PUT | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/goals/{goal}` | DELETE | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/goals/{goal}/progress` | GET | — | AVAILABLE BUT NOT INTEGRATED | Works |
| `/meditation/goals/{goal}/progress` | POST | — | AVAILABLE BUT NOT INTEGRATED | Works |

### Meditation reminders (4)

| Endpoint | Method | Screen | Status | Notes |
|---|---|---|---|---|
| `/meditation/reminders` | GET | MeditationReminders | INTEGRATED & VERIFIED | |
| `/meditation/reminders` | POST | MeditationReminders | INTEGRATED & VERIFIED | `days_of_week` as comma string (an array → 422) |
| `/meditation/reminders/{reminder}` | PUT | MeditationReminders | INTEGRATED & VERIFIED | |
| `/meditation/reminders/{reminder}` | DELETE | MeditationReminders | INTEGRATED & VERIFIED | |

## Not in the doc and not on the server

Activity / workouts / yoga / training, notifications and push tokens, account
deletion, password reset, email verification, token refresh, fasting plans,
meditation templates, breathing schemes, meditation audio refresh and playback
progress, pagination. See `BACKEND_API_REQUIREMENTS.txt`. The app has **no
Yoga or Training screens**.

## Why the remaining 34 are not integrated

No existing screen needs them, and integrations weren't added just to raise the count:

- **No UI for the action (product decision):** goal get/delete/progress (4); weight latest/get/update/delete (4); food update/delete (2); meal get/update/delete (3); meal-item update (1); recipe get/delete (2); meditation session get/update/delete (3); all 7 `/meditation/goals` routes (the same records arrive via `/goals`).
- **Redundant with what the app already loads:** `/streaks/{type}`, `GET /profile` (same as `/auth/me`), `/nutrition/day` (same totals as `/meals`), `/nutrition/log` (same effect as `/meals` + items), `/energy/bmr` (included in `/energy/balance`).
- **No data on the server yet:** `/food-categories`, `/meditation/categories`.
- **Not working on the server:** `/nutrition/recognize`.

## Counts

| Metric | Count |
|---|---|
| Endpoints documented | **84** |
| Verified working on the live server | **81** |
| Implemented but failing | **2** (`/nutrition/recognize` stub; barcode lookup has no product database) |
| Unverifiable (no data) | **1** (`GET /meditation/{meditation}`) |
| Integrated in the app | **50** (44 → 50 this round) |
| …verified through the app's own code (harness) | **43** |
| …raw-verified only | **5** (`POST /goals`, `POST /foods`, `GET /foods/{food}`, `GET /recipes`, `PUT /recipes/{recipe}`) |
| …integrated but failing or unverifiable | **2** (barcode lookup; `GET /meditation/{meditation}`) |
| Available but not integrated | **34** (reasons above) |
| Missing from backend | **29** required new endpoints + 2 optional, **13** changes to existing ones (`BACKEND_API_REQUIREMENTS.txt`) |
