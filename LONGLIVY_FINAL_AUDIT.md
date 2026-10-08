# LongLivy — Final Audit

Updated: 2026-10-08 (second round) · App: React Native / Expo SDK 57 (`com.longlivy.app` 0.1.0)
Backend: `https://longlivy.digitallhut.com/api/v1` (Laravel + Sanctum)
Contract: `docs/API_DOC.txt` (84 documented endpoints)

Companion documents:

- `API_INTEGRATION_STATUS.md` — all 84 endpoints, status, and why each unused one is unused
- `BACKEND_API_REQUIREMENTS.txt` — copy-paste spec for the backend developer, ordered P0 / P1 / P2
- `MEDITATION_BACKEND_CONTRACT.md` — meditation content, audio, sessions, progress, favorites

## 0. Verification

| Check | Result |
|---|---|
| TypeScript (`npx tsc --noEmit`) | Pass |
| Unit tests (`npm test`) | 64 / 64 pass |
| Lint (`npm run lint`, newly configured) | 0 errors, 99 warnings (see F20) |
| Live API harness: the app's own API/repository code against the server | 47 / 47 pass (44 end-to-end + 3 token-expiry) |
| Cross-account isolation (API) | 13 of 13 attempts on another user's records → 403 |
| iOS simulator UI flows (Maestro, iPhone 17 Pro, iOS 26.5) | Pass: wrong password message · login · session survives an app restart · all six tabs · food search → log 150 g banana (server write verified) · start fast → end fast (server write verified) · logout · switch to a second account with **no data from the first** · address step for an account without one |

**Not tested:**

- **Android:** there is no `android/` project yet (`npx expo prebuild` needed); nothing was built or run.
- **Physical devices:** nothing was run on hardware. That leaves background/lock-screen audio, camera barcode scanning, push notifications, HealthKit / Health Connect, GPS tracking and the BLE device untested.
- **UI flows not driven:** the meditation player end to end (the session API was tested), weight entry, recipes, reminders and edit profile. Their API layer is covered by the harness.

## 1. Critical findings

| # | Finding | Status |
|---|---|---|
| C1 | **Laravel debug mode is on in production.** Errors return stack traces and server paths. | **Open — backend P0** (requirements #0). The app hides 5xx bodies from users. |
| C2 | App called `/login`, `/register`, `/me`; the API uses `/auth/*`. | Fixed (round 1) |
| C3 | Auth parser read names from the wrong place (`user` instead of `user.profile`). | Fixed (round 1) |
| C4 | All data scoped to a hard-coded demo user. | Fixed (round 1) |
| C5 | Real email in the bundled demo data. | Fixed in source (round 1); **still in git history** |
| C6 | No account deletion (store requirement). | **Open — backend P0** (#1) |
| C7 | No password reset / email verification. | **Open — backend P0 / P1** (#2–5) |
| C8 | Meditation catalog on the server is empty; no backend audio. | **Open — backend P1** (#6). The app plays its bundled catalog, clearly labeled "included with the app". |
| C9 | No shared food catalog; documented barcode lookup fails for real products. | **Open — backend P1** (#12–13). The app merges an on-device reference catalog into search. |
| C10 | Photo recognition showed a **fabricated sample meal**; text recognition invented a "best guess" food when nothing matched. | **Fixed (round 2):** photo entry hidden behind `features.photoMealRecognition` (off), the sample meal deleted, the text fallback removed (a "No foods recognized" message is shown instead) |
| C11 | Mock mode was the default. | Fixed (round 1) |
| C12 | Activity levels used names the API rejects. | Fixed (round 1) |
| C13 | **Cross-account leak on a shared device:** after logout, the next account saw the previous account's calorie target ("2606 kcal remaining"). Found by the UI account-switch test. | **Fixed (round 2):** user-data slices reset on logout and session expiry (`src/store/resetOnSessionEnd.ts`), persisted calorie state is cleared, insights reset. Re-tested in the simulator: account B shows none of A's data. |
| C14 | The API rate-limits each user (HTTP 429 after about 60 requests a minute). | Noted. Normal use stays well below it; the app shows "Too many requests" on a 429. Backend asked to document it and send `Retry-After` (requirements note). |

## 2. Implemented in round 2

| Area | Change | Files |
|---|---|---|
| Server aggregates | New `insights` slice loads `/streaks`, `/fasting/summary`, `/meditation/home`, `/meditation/stats`, `/energy/balance` in parallel (one failure never blanks the others). It refreshes automatically, debounced, after data loads and after every change (start/end fast, log food, complete meditation, weight, profile, targets). | `services/api/insightsApi.ts`, `features/insights/*`, `store/store.ts` |
| Selectors | Fasting stats, meditation streak and stats, and the dashboard energy balance prefer server values and fall back to on-device calculation. Cancelled meditation exits (under a minute) no longer count as sessions or minutes. | `features/fasting/selectors.ts`, `features/meditation/selectors.ts`, `features/calories/selectors.ts`, `features/statistics/selectors.ts` |
| Misleading content | Photo meal entry hidden on the dashboard and nutrition screens; fabricated photo and text results removed; AI card copy changed to "Speak or type your meal" | `config/features.ts`, `AiNutritionRecognitionService.ts`, `AiPhotoEntryScreen.tsx`, `AiTextVoiceEntryScreen.tsx`, `NutritionDashboardScreen.tsx`, `QuickActions.tsx`, `localization/*` |
| Meditation | Bundled content labeled on Home and Details; load error with Retry; server thumbnails shown; signed audio URLs refreshed before playback | `MeditationHomeScreen.tsx`, `MeditationDetailsScreen.tsx`, `hooks/useFreshAudioUrl.ts`, `MeditationPlayerScreen.tsx` |
| Recipe builder (F7) | Search across server and catalog foods instead of a fixed list of 8; editable amount per ingredient; totals from the amounts; error alert on a failed save | `CreateRecipeScreen.tsx` |
| Meal items | Removing an item asks for confirmation, can't fire twice, and shows an error if it fails | `MealDetailsScreen.tsx` |
| Privacy | Session-end reset of user data (C13) | `store/resetOnSessionEnd.ts`, `features/calories/repository.ts`, `services/auth/authService.ts` |
| Nutrition targets | Whole-number targets; a 422 from `/energy/targets/calculate` (profile missing birth date or height) no longer fails the load | `nutritionTargetsApi.ts`, `nutritionSlice.ts` |
| Small fixes | Food rows no longer show "Brand · ," for foods without a category; removed meal item is labeled with the right user | `FoodSearchScreen.tsx`, `ApiNutritionRepository.ts` |
| Lint | ESLint 9 + `eslint-config-expo` (flat config) installed as dev dependencies; `npm run lint` works; unused imports removed | `eslint.config.js`, `package.json`, `metro.config.js`, 5 files |

Edit/delete routes were **not** wired: no existing screen has an edit or delete
action for weight, meals, recipes or goals, and adding UI is a product decision.
The two existing actions (remove a meal item, edit the fasting schedule) were
already wired.

## 3. Module status

Statuses: **Working and verified** · **Implemented but unverified** · **Blocked by backend** · **Frontend pending** · **Not implemented**

| Module | Status | Notes |
|---|---|---|
| Authentication (login, register, restore, logout, expiry) | **Working and verified** (API + simulator UI) | Register UI not driven in the simulator; API verified |
| Password reset, email verification, account deletion | **Blocked by backend** | #1–5 |
| Onboarding | **Working** (device) | Goal, pace and preferences stay local (#21) |
| Profile & settings | **Working and verified** (API) · edit screen not driven in UI | |
| Home dashboard | **Working and verified** (simulator) | Server streaks, energy balance and target; no fake notifications |
| Fasting sessions, history, statistics | **Working and verified** (API + simulator start/end) | 72h/96h blocked by the 48h server cap (#19) |
| Fasting plans | **Blocked by backend** (device only) | #17–18 |
| Weight | **Working and verified** (API) | No edit/delete UI |
| Goals | **Working and verified** (API) | |
| Nutrition logging, own foods, recipes, favorites | **Working and verified** (API + simulator logging) | Reference catalog until #12 |
| Nutrition targets & energy balance | **Working and verified** | Backend bugs #15 |
| Barcode | **Blocked by backend** | #13 |
| AI food entry | Photo **disabled until backend** (#14); text/voice **working** (on-device matcher, only real catalog foods, never invents) | |
| Activity tracking | **Blocked by backend** (device only, per user) | #20 |
| Yoga / Training | **Not implemented** | No screens; not in the doc |
| Meditation library & audio | **Blocked by backend** | Bundled catalog, clearly labeled |
| Meditation sessions, history, home, statistics, reminders | **Working and verified** | |
| Custom meditations, breathing patterns | **Blocked by backend** (device / bundled) | #10, #11 |
| Notifications (push, inbox, settings) | **Blocked by backend** + **frontend pending** | #22–24; settings aren't persisted locally |
| Statistics screen | **Working** (derived from server data) | Paging #25 for scale |
| Health integrations / BLE | **Not in API scope** · untested on hardware | |

## 4. Frontend pending work

Fixed this round: old F4 (server aggregates), F5 (energy balance), F7 (recipe builder), F22 (ESLint), F24 (meal user id), C10 and C13.

Classes: **FE** frontend-only · **BE** backend dependency · **CFG** configuration · **3P** third-party service · **PD** product decision · **TEST** needs testing

| # | Issue | Location | Class |
|---|---|---|---|
| F1 | "Delete my account" does nothing | `src/screens/home/PrivacyScreen.tsx:35` | BE (#1) |
| F2 | Password reset / email verification show "not available yet" | `src/services/api/authApi.ts`, `ForgotPasswordScreen.tsx`, `EmailVerificationScreen.tsx` | BE (#2–5) |
| F3 | Photo meal entry hidden until real recognition | `src/config/features.ts` | BE (#14) |
| F6 | No edit/delete UI for weight, meals, recipes, goals (routes exist) | `EnterWeightScreen.tsx`, `MealDetailsScreen.tsx`, `MyRecipesScreen.tsx`, `GoalsScreen.tsx` | PD |
| F8 | Food search and barcode merge the on-device catalog | `ApiNutritionRepository.ts` `catalogMatches` | BE (#12–13) |
| F9 | `custom` meal type sent as `snack` | `ApiNutritionRepository.ts` `apiMealType` | PD |
| F10 | 72h/96h fasts offered but rejected by the server (clear message) | `SelectFastingMethodScreen.tsx` | BE (#19) or PD (hide) |
| F11 | Moving a running fast's start re-creates it; cancel deletes it | `ApiFastingRepository.ts` | BE (#19) |
| F12 | Fasting plans on the device only | `ApiFastingRepository.ts` `planStore` | BE (#17–18) |
| F13 | Activity on the device only; its calories never reach the server | `LocalActivityRepository.ts` | BE (#20) |
| F14 | Meditation: bundled fallback active; progress heartbeat and mid-stream 403 recovery not built | `ApiMeditationRepository.ts`, `MeditationPlayerScreen.tsx` | BE (#6, #8) then FE |
| F15 | Meditation templates on the device; breathing patterns bundled | `ApiMeditationRepository.ts` | BE (#10–11) |
| F16 | Notification settings reset on restart; no push token registration; inbox empty | `notificationSlice.ts` | BE (#22–24) + FE + 3P |
| F17 | Goal, pace, preferences, avatar not synced. A user who signs in on a new device without onboarding gets a default goal ("Weight loss") they never chose. | `profileThunks.ts`, `features/profile/repository.ts` `API_PROFILE_DEFAULT` | BE (#21) + PD (which default) |
| F18 | No offline write queue (writes fail with a clear message when offline) | `SyncManager.ts` | PD + FE |
| F19 | History lists load in full (no paging) | `fastingApi.list`, `weightApi.list`, `meditationApi.listSessions` | BE (#25) |
| F20 | 99 lint warnings, mostly React Compiler diagnostics in the audio, GPS and timer hooks plus unused code in `NoiseDeviceScreen.tsx`; downgraded to warnings, not fixed, to avoid changing working hook behavior | `eslint.config.js` | CFG / FE (post-launch) |
| F21 | Data export is the in-memory snapshot, not the full account | `DataManagementScreen.tsx` | PD + BE |
| F23 | Real email still in git history | `src/mock/demoUser.ts` history | CFG / PD |
| F25 | Android and physical-device testing (list in §0) | — | TEST |
| F26 | Ending a fast has no confirmation step (one tap ends it) | `ActiveFastScreen.tsx` | PD |
| F27 | Welcome screen shows illustrative numbers ("14h 32m fasted", "Protein 82%") before sign-up; they aren't user data, but could read as stats | `localization/en.ts` `onboarding.welcome.signals` | PD |

## 5. Production readiness

| Area | Status |
|---|---|
| Environment / base URL / mock switch | READY (mock impossible in production builds) |
| Auth & token storage | READY (SecureStore; 401 → sign-out; logout revokes the token) · token lifetime undocumented (#28d) |
| Per-user data isolation | VERIFIED on the server (API) and in the app (account switch) |
| Server error leakage | **BLOCKER** (C1) |
| Account deletion | **BLOCKER** (store policy) |
| Password recovery | **BLOCKER** |
| Misleading / demo content | READY in signed-in flows (fabricated recognition removed, bundled meditation labeled, no fake notifications); welcome illustrations are F27 |
| Error handling | READY for network / timeout / validation / 401 / 429 / 5xx with readable messages; no offline queue |
| Lint / types / unit tests | READY (0 errors) |
| iOS | Simulator build and core flows verified · physical device untested |
| Android | **NOT BUILT** |
| Background audio, push, health, GPS, BLE | Untested on hardware |

## 6. Numbers

| # | Metric | Value |
|---|---|---|
| 1 | APIs documented | 84 |
| 2 | Verified working on the server | 81 (failing: recognize stub, barcode lookup; unverifiable: `GET /meditation/{id}`) |
| 3 | Integrated | **50** (was 44): 43 harness-verified, 5 raw-verified, 1 failing (barcode), 1 unverifiable |
| 4 | Not integrated | 34; each has a stated reason (no UI, redundant, empty, or broken) |
| 5 | Missing from the backend | 29 required new endpoints (+2 optional) and 13 changes; **P0: debug mode + 3 endpoints** |
| 6 | Frontend issues remaining | 21 (F1–F27, minus the fixed ones): 12 backend-dependent, 6 product decisions, 2 configuration, 1 testing |
| 7 | Blockers to publishing | C1 debug mode · #1 account deletion · #2–3 password reset · Android build and device QA. Strongly recommended before launch: #6 meditation content, #12–13 food catalog and barcode |
| 8 | Remaining effort | Backend P0 about 4–5 dev-days; P1 about 15–20; P2 about 5. Frontend after backend lands: about 2 days for P0 (delete account, reset flow), about 5–7 for P1 integrations. Device QA (iOS + Android): 2–3 days. |
| 9 | Ready for production? | **No.** Core flows work against the real backend, but the P0 items above are still open. |

Test accounts (remove server-side; there's no deletion API):
`claude.audit+20261008@example.com` (id 2), `claude.audit.b+20261008@example.com` (id 3).
