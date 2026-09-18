# HealthyMe (Prototype)

A React Native + TypeScript wireframe/prototype of the HealthyMe wellness
platform: fasting, nutrition, calories, activity, meditation, statistics,
goals and health integrations — all connected through a shared data model,
running today on local mock repositories.

## Getting started

```bash
npm install
npm run start   # then press i (iOS), a (Android), or w (web)
```

Demo login is pre-filled on the login screen:

- Email: whatever you registered with, or the seeded demo account
- Password: `demo1234`

Onboarding is required once; after completing it you land in the mock
authenticated session automatically.

## Architecture

See [API_MIGRATION.md](./API_MIGRATION.md) for how mock repositories map to
a future real backend, and the layering:

```
UI -> Redux Toolkit -> Use-case/services -> Repository interface -> Mock repository
```

Folder layout:

- `src/features/<feature>/` — models, repository (+mock impl), services,
  Redux slice, selectors, feature-specific screens/components/hooks.
- `src/components/common/` — shared design-system primitives (AppButton,
  AppCard, AppProgressRing, etc.) — every screen composes these instead of
  ad hoc styling.
- `src/components/hoc/` — withErrorBoundary, withLoading, withScreenTracking,
  withAuthGuard.
- `src/navigation/` — one stack navigator per feature, composed into a
  bottom tab navigator, composed into the root stack
  (Splash → Onboarding → Auth → Main).
- `src/store/` — Redux store assembly + typed hooks.
- `src/theme/` — design tokens (colors, typography, spacing, shadows),
  consumed via `ThemeContext` / `useTheme()`.
- `src/mock/` — seed data for the mock repositories.
- `src/services/` — cross-cutting infra: API placeholder, offline storage,
  sync manager.

## Notable business rules implemented

- Fasting/meditation/activity timers derive their displayed value from
  timestamps on a local render loop — never from a Redux value updated
  every second.
- `NutritionCalculationService.calculateGoalProgress` always reports
  "exceeded by N", never a negative "remaining" value.
- `DoubleCountingGuard` prevents an imported/tracked activity's calories
  from being credited to the daily balance twice.
- `MeditationSessionCalculator` derives active/paused seconds from a
  session's event log, so pauses never count as meditation time.
- The fasting timeline uses deliberately cautious language ("can begin",
  "typically", "varies between people") and never asserts an exact
  biological timing — see `FastingTimeline.tsx` and `SafetyNotice.tsx`.
- Missing statistics data renders "No data available", never a fabricated
  value.
