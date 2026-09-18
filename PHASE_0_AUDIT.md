# Phase 0 — Existing Project Audit

Status: **complete, no code changed**. This audit inspects `longlivy-app` (the
folder referred to informally as "LongLive app") against the Longlivy 2.0
Phased Redesign PRD, so the next session can start Phase 1 with an agreed
plan instead of re-discovering the codebase.

---

## 1. What this project actually is today

Important correction to the PRD's assumption: this is **not** a dated legacy
app that needs modernizing. It's an actively-developed, well-architected
prototype that already went through at least one deliberate design pass (see
`src/theme/colors.ts`'s "v5/v6 palette" comments and a git history full of
"Redesign X to premium hero theme" commits). ~34,000 lines of TypeScript
across 250 files, one clean commit history on `main`, working tree clean.

It runs entirely on **local mock repositories** (`AsyncStorage`-backed) —
there is no deployed backend yet. `API_MIGRATION.md` (already in the repo)
documents a clean swap path from mock to real API per feature.

**Stack**: Expo SDK 57, React Native 0.86.2, React 19.2.3, TypeScript
(strict), React Navigation 7 (native-stack + bottom-tabs), Redux Toolkit +
react-redux, Axios, `react-native-reanimated` 4 + `react-native-worklets`,
`react-native-svg`, `@react-three/fiber` + `three` (used for a 3D body
visualizer in onboarding), `expo-secure-store`, `expo-notifications`,
`expo-audio`, `expo-camera`/`expo-image-picker` (AI meal logging),
`expo-location` (GPS activity tracking), `react-native-ble-plx` (Noise
smartwatch integration), `@kingstinct/react-native-healthkit` +
`react-native-health-connect` (Apple Health / Health Connect).

Two `patch-package` patches are applied (`expo-modules-core`,
`expo-modules-jsi`) — a dependency risk to carry forward and re-verify on any
Expo upgrade. **No test suite exists** (`find *.test.*` → 0 results) and no
committed ESLint/Prettier config despite a `lint` script in `package.json` —
both are technical debt, not blockers.

---

## 2. Architecture map

```
UI (screens/components)
  -> Redux Toolkit (slices, thunks)
    -> Use-case/service layer (FastingCalculator, CalorieCalculationEngine, ...)
      -> Repository interface (e.g. FastingRepository)
        -> Mock<Feature>Repository (AsyncStorage) | Api<Feature>Repository (Axios) — swappable per feature
```

- **Navigation**: `RootNavigator` gates on state, not routes:
  `Splash → Language (first launch) → Onboarding → Auth → Main (tabs)`.
  Main tabs (7, via a custom `FloatingTabBar`, one visible slot swapped for a
  center action button): Home, Profile, Fasting, Nutrition, Activity,
  Meditation, Statistics. Each tab is its own stack navigator
  (`HomeNavigator`, `FastingNavigator`, etc.) composed in `MainTabNavigator`.
- **State**: Redux Toolkit, one slice per feature (17 slices in
  `store/store.ts`), all serializable-check-enabled. Selectors live beside
  each slice (`features/<x>/selectors.ts`).
- **Auth**: `AuthRepository` interface with `MockAuthRepository` and a
  real `ApiAuthRepository` (Axios) already implemented, including 401 →
  refresh → retry with a request queue (single in-flight refresh, concurrent
  401s wait on it) and auto-logout on refresh failure. Tokens via
  `expo-secure-store`. Switch is one env var
  (`EXPO_PUBLIC_API_BASE_URL`) — see `src/config/env.ts`.
- **Theme**: `src/theme/` — `colors` (light/dark, per-pillar semantic hues),
  `typography`, `spacing`/`radius`/`componentSizes`, `shadows`,
  `gradients`, `motion` (shared duration/easing/stagger tokens), assembled
  by `buildTheme()` and consumed via `ThemeContext`/`useTheme()`. This is
  functionally a design-token system already — see §5.
- **Design-system components**: `src/components/common/` — 22 components
  including `AppButton`, `AppCard`, `AppChip`, `AppProgressBar`/
  `AppProgressRing`, `AppHeader`, `AppEmptyState`, `AppErrorState`,
  `AppLoader`, `AppSkeleton`, `AppInput`, `AppSwitch`,
  `AppSegmentedControl`, plus motion helpers (`FadeSlideIn`,
  `StaggerGroup`, `AnimatedNumberText`) and "hero" layout primitives
  (`SectionHeroLayout`, `TabHeroLayout`, `HeroCard`, `HeroChip`,
  `HeroOptionCard`, `HeroTextField`). `src/components/hoc/` adds
  `withErrorBoundary`, `withLoading`, `withScreenTracking`,
  `withAuthGuard`.
- **Localization**: `src/localization/` — full `I18nContext` +
  `en.ts`/`de.ts` (729/713 lines, i.e. essentially every UI string is
  already externalized), `locale.ts`, `types.ts`.
- **Notifications**: `expo-notifications` wired for fasting events, activity
  reminders, calorie/protein goal events, weight reminders, and meditation
  reminders (`features/notifications/`, `features/meditation/services/
  MeditationNotificationService.ts`), plus a tap handler in `App.tsx` that
  deep-links a tapped meditation reminder to Meditation Home.
- **Health integrations**: `features/health` (adapter interface +
  `MockHealthAdapter`), `features/healthKit`, `features/healthConnect` —
  separate slices per platform, normalized into common
  `HealthActivity`/`HealthSleep`/`HealthSteps`/`HealthWeight`/
  `HealthHeartRate` shapes. `features/noise/ble/` is a substantial BLE
  integration (GATT parsing, vendor-specific parsers) for a **Noise-brand
  smartwatch** — this is a third-party hardware integration, not a
  metaphorical "noise" feature; it's referenced by name in `app.json`
  permission strings and needs explicit rebrand handling (see §6).
- **Config/secrets**: `src/config/env.ts` centralizes all `EXPO_PUBLIC_*`
  reads — nothing else touches `process.env` directly. Good precedent to
  extend for Supabase env vars.

---

## 3. Feature-by-feature audit

| Domain | Maturity | Notes |
|---|---|---|
| **Auth** | High | Login/Register/ForgotPassword/EmailVerification/Address. Real API-ready repository + token refresh flow already built, just needs a live backend. |
| **Onboarding** | Medium | Linear, single-branch: Welcome → Value → **single-select** Goal (weight_loss / maintenance / muscle_gain only) → PersonalizeMe → Gender → DOB → Height → Weight → ActivityLevel → Micronutrients → CompleteSetup. Includes a genuinely distinctive **3D human-body visualizer** (`@react-three/fiber`, `HumanBodyVisualizer`/`HumanFigureGltf`/`HumanFigureMesh`) reacting to body metrics. State lives in an in-memory `OnboardingContext` (React context, not persisted) — **not resumable across app kill**, which the new PRD's Phase 2 explicitly requires. No meditation/yoga/fasting/sleep goals exist anywhere in onboarding. |
| **Fasting** | High | Very complete: method selection, custom plans, live timer (render-loop driven, not Redux-ticked — explicitly documented as a business rule), calendar, history, streaks, statistics, safety notice with deliberately cautious language, plan CRUD. Maps closely to PRD Phase 9's Fasting MVP already. |
| **Nutrition** | High | Dashboard, food search, barcode scanner, manual food/recipe CRUD, favorites, history, goals — plus **AI-assisted logging** already scaffolded (`AiPhotoEntryScreen`, `AiTextVoiceEntryScreen`, `AiMealReviewScreen`, `AiNutritionRecognitionService`). This is a head start on PRD Phase 10's Dietitian foundation, though it's meal-recognition, not a chat-based dietitian — the conversational/chat piece doesn't exist yet. |
| **Activity** | High | GPS-tracked run/cycle/walk activities (`useGpsTracking`), voice coaching (`useVoiceCoach`/`VoiceAnnouncer`), manual entry, history, and live BLE sync from a **Noise smartwatch** (`features/noise/`). This is cardio/outdoor activity tracking, not structured gym workouts — there is **no exercise library, no sets/reps/rest-timer workout builder**, i.e. PRD Phase 6 (Fitness & Workout MVP) doesn't exist in any form yet. |
| **Meditation** | High | Already matches the PRD's target shape unusually well: guided + unguided (music/ambient/nature sounds), breathing exercises with a synchronized inhale/hold/exhale visual (`BreathingAnimation`, `useBreathingPhaseEngine`), session history, favorites, reminders, statistics, templates. `MeditationSessionCalculator` already derives active/paused time from an event log (pauses don't count) — a subtlety the PRD doesn't even ask for explicitly. This is the single closest-to-done domain relative to the PRD. |
| **Yoga** | None | Does not exist in any form — no screens, no model, no nav stack. Full PRD Phase 8 buildout required. |
| **Weight / Statistics / Goals / History** | Medium-High | Weight entry + history, cross-feature statistics screen, streak service, a generic history screen. Reusable as-is; Statistics currently has a single `StatisticsHome` route (PRD's "Progress" tab maps onto this). |
| **Profile / Settings** | High | Profile, edit profile, settings, health integrations, Noise device pairing, privacy, data management, feedback. Custom **original SVG avatar system** (`features/profile/avatars/`) — explicitly documented as original art with no licensing risk, cleared for commercial use. Worth keeping regardless of rebrand. |
| **Notifications** | Medium-High | Settings screen + typed event model already covers fasting/activity/calorie/weight/meditation events. |
| **Shop** | Scaffold only | `features/shop/models.ts` is deliberately unreferenced type scaffolding for a future webshop (explicitly documented as intentional, not dead code). Not part of the PRD's scope — leave untouched. |
| **Sync** | Skeleton | `features/sync/SyncManager.ts` models an enqueue → flush → mark-synced lifecycle against a no-op `flush()`. Ready to point at real network calls once repositories go live. |
| **Premium/Entitlements** | None | No subscription/entitlement concept anywhere in the codebase. Full PRD Phase 13 buildout required. |
| **Remote config/feature flags** | None | No `app_config`, no maintenance-mode/force-update UI, no flag system. Full PRD Phase 12 buildout required. |
| **Admin/content management** | None | Nothing — expected, PRD Phase 14 is a separate web app anyway. |
| **Backend** | Mock only | AsyncStorage-backed mock repositories everywhere; a real REST/Axios backend is designed-for but not deployed. **No Supabase anywhere** — the PRD's backend choice is a genuinely new addition, not a migration of an existing Supabase setup. |

---

## 4. Reusable design primitives (this is more than the PRD's Phase 1 assumed)

The PRD's Phase 1 ("Rebrandable Design Foundation") asks for theme tokens,
dark/light support, and a `Button/Card/Chip/Progress/Header/Empty/Loading/
Error` component set. **All of that already exists** (`src/theme/*`,
`src/components/common/*`, listed in §2). Phase 1 is therefore not a
from-scratch build — it's an **audit-and-selectively-rework** pass:

- Token *structure* (semantic color roles, type scale, spacing scale,
  motion scale) is sound and should be kept as the mechanism.
- Token *values* (the actual hex palette, the specific gradients, the exact
  "hero" layout visual language) are what need to change for the new brand
  to not feel like reskinned Longlivy — see §6.
- Component *API surface* (props, composition patterns like
  `SectionHeroLayout` + `StaggerGroup`) is reusable; visual styling inside
  each component is what gets redesigned.
- **Branding is not yet centralized** — the app name/bundle ID/permission
  copy live in `app.json` (`"Longlivy"`, `com.longlivy.app`, strings like
  *"Longlivy uses the camera to..."* and *"...your Noise smartwatch"*), and
  `en.ts`/`de.ts` almost certainly contain the brand name inline in various
  strings (not yet verified string-by-string). This needs a real
  centralization pass, which the PRD correctly calls for.

---

## 5. Classification: Keep / Refactor / Redesign / Remove

| Module | Classification | Why |
|---|---|---|
| Redux store shape, slices, selectors | **Keep** | PRD Phase 4/migration explicitly requires business logic and selectors to survive untouched (mirrors this project's own `API_MIGRATION.md` "must not change" list). |
| Business/calculation services (`FastingCalculator`, `CalorieCalculationEngine`, `EnergyBalanceEngine`, `DoubleCountingGuard`, `MeditationSessionCalculator`, `StreakService`, `NutritionCalculationService`) | **Keep** | Correct, tested-by-design business rules (double-counting guard, pause-aware meditation timing, "exceeded by N" never negative, calculation versioning). High value, zero coupling to visuals. |
| Repository interfaces + mock implementations | **Keep** | Backend-agnostic by design; this is exactly the seam Supabase-backed implementations plug into (see §7). |
| Auth token/refresh flow, `apiClient.ts` | **Keep** | Solid, secure (secure-store tokens, single in-flight refresh, no secrets logged). Supabase Auth can either replace this or this pattern can wrap Supabase's client — decide in Phase 4. |
| Health adapters (HealthKit/Health Connect), GPS tracking, voice coach | **Keep as engineering, review as UX** | Genuinely hard-won native integration work. Keep the adapters and hooks; the *screens* that surface them get redesigned. |
| Noise smartwatch BLE (`features/noise/**`, `NoiseDeviceScreen`, `react-native-ble-plx`) | **Remove** | Decided 2026-09-17 — out of scope for the new product. Remove in Phase 1 alongside the `app.json` rebrand pass so the deletion is part of a reviewable phase, not ad hoc. |
| Localization infra (`I18nContext`, locale system) | **Keep** | Infra is sound; string *content* gets rewritten for the new brand voice/name as part of redesign, not rebuilt. |
| Notification infra | **Keep** | Event model and scheduling logic are reusable; copy and any in-app notification UI get redesigned. |
| Avatar SVG system | **Keep** | Original art, no licensing risk, not visually tied to any "Longlivy-specific" branding beyond the name of the directory. |
| Theme *token structure* (`ThemeContext`, `buildTheme`, the six token files) | **Refactor** | Keep the mechanism; replace values; add the centralized branding/config layer the PRD asks for (app name, logo, copy as data, not scattered literals). |
| `src/components/common/*` | **Refactor** | Keep component contracts where sound; restyle for the new visual identity; consolidate where the PRD's "avoid duplicate components" applies (e.g. confirm `AppProgressBar` vs `AppProgressRing` vs any per-feature progress visuals aren't drifting). |
| All screens (`src/screens/**`, feature-local screen components) | **Redesign** | Per the user's explicit requirement: functionality and data-fetching logic stay, visual/interaction layer is rebuilt so the product doesn't read as reskinned Longlivy. This includes the floating tab bar, hero layouts, cards, and the onboarding flow's visual treatment (the 3D body visualizer's *concept* is strong and worth keeping — its specific styling gets redesigned alongside everything else). |
| Bottom navigation structure (7 tabs via `FloatingTabBar`) | **Redesign** | PRD explicitly proposes `Home / Explore / Activity / Progress / Profile` with Explore nesting Workout/Meditation/Yoga/Fasting/Nutrition, specifically to avoid overcrowding — current 7-tab structure is what that's reacting against. |
| Onboarding goal model (single-select, 3 goals, non-persistent) | **Redesign** (data model) + **Add** (persistence, branching) | Needs to become the PRD's multi-select 10-goal model with resumable local persistence and dynamic branches — this is Phase 2/3 work, not a cosmetic change. |
| `app.json` branding fields, permission strings | **Redesign/Refactor** | Rename, re-bundle-ID, rewrite every permission string away from "Longlivy"/"Noise smartwatch" phrasing (the *capability* — BLE smartwatch pairing — stays; the wording should be neutral/reusable or reference the new brand). |
| `features/shop/*` | **Leave alone** | Explicitly out of scope for the PRD; deliberately unreferenced scaffolding, not dead code — do not touch or delete. |
| Patches (`patch-package`) | **Keep, verify** | Necessary for current Expo SDK; re-verify compatibility if/when Expo version changes. |
| Nothing identified for outright **Remove** | — | No dead screens, orphaned navigators, or abandoned features found. The one file that looks unreferenced (`shop/models.ts`) is intentionally-unreferenced scaffolding per its own doc comment, not debris. |

---

## 6. Gap analysis vs. the new PRD (what must be *added*, not migrated)

These have no existing counterpart to reuse — they are net-new build, same
as the PRD phases already assume:

1. **Yoga** (Phase 8) — entire domain.
2. **Fitness & Workout MVP** (Phase 6) — exercise library, workout/program
   schema, sets/reps/rest timer, completion flow. `Activity` today only
   covers cardio; nothing overlaps with structured strength training.
3. **Digital Dietitian chat** (Phase 10) — nutrition tracking and AI meal
   recognition exist; a conversational chat UI backed by a server-side AI
   gateway does not.
4. **Supabase foundation** (Phase 4) — no Supabase anywhere; this is the
   single biggest architectural addition. Good news: the repository-pattern
   seam already exists to receive it cleanly (see §7).
5. **Entitlements/Premium/Paywall** (Phase 13) — none exists.
6. **Remote config/feature flags/update gating** (Phase 12) — none exists.
7. **Admin/content dashboard** (Phase 14) — none exists (separate web app,
   as PRD already scopes it).
8. **Rebrandable config layer** (name/logo/colors centralized, not
   hardcoded) — theme token *mechanism* exists; the centralization of brand
   identity as swappable config does not yet.
9. **Onboarding persistence + multi-goal branching** (Phases 2–3) — current
   onboarding state is in-memory only and single-goal.
10. **Home as a personalized module registry** (Phase 5) — current Home is
    a fixed, hardcoded section list (`HomeDashboardScreen`'s `SECTIONS`
    array) shown identically to every user regardless of goals — exactly
    the anti-pattern PRD Phase 5 calls out.

---

## 7. Proposed migration architecture

- **Backend**: Introduce Supabase alongside the existing repository-swap
  pattern rather than replacing it. Concretely: write
  `Supabase<Feature>Repository` classes implementing the same repository
  interfaces the mocks already satisfy (`FastingRepository`,
  `NutritionRepository`, etc.), and swap the exported singleton — the exact
  mechanism `API_MIGRATION.md` already documents for a generic REST API.
  Auth can move to Supabase Auth behind the existing `AuthRepository`
  interface; the current `ApiAuthRepository`'s refresh-queue pattern is a
  reasonable reference even if Supabase's client handles refresh
  internally. New domains (Workout, Yoga, Dietitian) get their tables and
  repositories built Supabase-native from day one — no migration needed for
  those since they don't exist yet.
- **Design system**: keep `ThemeContext`/`buildTheme` as the mechanism; add
  a small `branding.ts` (or similar) config module for name/logo/copy so
  Phase 1 satisfies "brand name/logo can be changed centrally" without
  restructuring the token system that already exists.
- **Navigation**: restructure `MainTabNavigator` from 7 tabs to the PRD's
  5 (`Home, Explore, Activity, Progress, Profile`), with a new `Explore`
  stack nesting Workout/Meditation/Yoga/Fasting/Nutrition. Existing
  per-feature navigators (`FastingNavigator`, `NutritionNavigator`,
  `MeditationNavigator`) can very likely be nested under the new `Explore`
  stack largely as-is; `ActivityNavigator` and a new `Progress`
  (statistics+weight+goals) stay top-level tabs per the PRD.
- **Home**: replace `HomeDashboardScreen`'s fixed `SECTIONS` array with a
  module registry keyed off the user's onboarding goals — the existing
  per-card components (`FastingCard`, `NutritionCard`, `ActivityCard`,
  `MeditationCard`, etc.) are reasonable candidates to survive as the
  *content* of registry modules even as their visual style is redesigned.
- **Onboarding**: move `OnboardingDraft` from in-memory React Context to a
  persisted (AsyncStorage-backed, resumable) store, and expand `goal` from
  a single enum to a multi-select set driving the PRD's dynamic branches —
  the existing per-step screen pattern (`OnboardingStepLayout` +
  `FadeSlideIn` stagger) is a reusable shell for new branch screens.

This is deliberately a *sequencing proposal*, not a file-by-file diff — with
~250 files, the actionable unit is "this module/screen group," and a literal
per-file line-item plan would be noise. Each phase below will touch a
specific, named set of files at implementation time.

---

## 8. Decisions (resolved 2026-09-17)

1. **App name/brand**: not finalized yet — proceed with a clearly-marked
   **placeholder brand, "Solace"** (com.solace.app-style bundle id) so
   Phase 1's centralized branding config can be built now. Every brand
   literal (name, bundle id, permission copy) routes through that one
   config module specifically so swapping in the real name later is a
   single-place edit, not a re-scan of the codebase.
2. **Noise smartwatch BLE integration**: **remove entirely.** This changes
   §5's classification for `features/noise/**` and
   `screens/home/NoiseDeviceScreen.tsx` from "Keep" to **Remove**, drops
   `react-native-ble-plx` from dependencies, removes `noiseReducer` from
   the store, and removes the `BLUETOOTH_SCAN`/`BLUETOOTH_CONNECT`
   Android permissions and `NSBluetoothAlwaysUsageDescription` from
   `app.json`. HealthKit/Health Connect remain the only wearable data
   sources. (Actioned in Phase 1, alongside the rest of the `app.json`
   rebrand — not before, so this stays a reviewable diff rather than an
   ad hoc deletion outside the phase plan.)
3. **3D onboarding body visualizer**: **keep**, restyle during Phase 2/3
   onboarding redesign rather than replacing it.
4. **Backend timing**: no objection raised — proceeding with the PRD's own
   ordering (design/onboarding phases before Supabase Phase 4).
5. **No test suite**: still open — deferring to Phase 15 unless it becomes
   a blocker earlier.

---

## 9. No destructive changes were made

This audit only read files. Nothing was deleted, renamed, or rewritten.
Per the PRD's own process (§6, "How to Use This PRD With Claude"), the next
step is explicit approval of Phase 1 scope — including a decision on the
open questions in §8 (especially the new app name) — before any code
changes begin.
