# API Migration Plan

This prototype runs entirely on local mock repositories backed by
`AsyncStorage`. Nothing in `src/screens`, `src/features/*/screens`,
`src/components`, Redux slices, or selectors talks to a mock repository
directly — everything flows through an interface:

```
UI (screens/components)
  -> Redux Toolkit (slices, thunks)
    -> Use-case / service layer (e.g. FastingService, CalorieCalculationEngine)
      -> Repository interface (e.g. FastingRepository)
        -> Mock<Feature>Repository   <-- swap this
```

## How to introduce a real backend

For each feature (`fasting`, `nutrition`, `activity`, `meditation`, `weight`,
`auth`, `health`):

1. **Design the REST/GraphQL contract** for that feature's repository
   interface (e.g. `src/features/fasting/repository/FastingRepository.ts`).
   The interface itself should not need to change — it was designed against
   the domain, not against AsyncStorage.
2. **Add RTK Query endpoints** in `src/services/api/` (e.g.
   `healthyMeApi.ts`) using `createApi` + `fetchBaseQuery` (or a custom
   `baseQuery` if the backend needs custom auth headers). Configure
   `apiClientConfig.baseUrl` from `src/services/api/apiClient.ts`.
3. **Implement `Api<Feature>Repository`** classes that satisfy the same
   repository interface, internally calling the generated RTK Query
   hooks/`initiate` thunks instead of `LocalStore`.
4. **Swap the exported singleton** at the bottom of each
   `Mock<Feature>Repository.ts` file:

   ```ts
   // Before
   export const fastingRepository: FastingRepository = new MockFastingRepository();

   // After
   export const fastingRepository: FastingRepository = new ApiFastingRepository();
   ```

   Because every consumer (slices, use-case services) imports the
   `fastingRepository` singleton — never the mock class directly — this is
   the only line that needs to change per feature.
5. **Authentication is already wired this way** — `ApiAuthRepository`
   (`src/features/auth/repository/ApiAuthRepository.ts`) implements
   `AuthRepository` against a real Axios client
   (`src/services/api/apiClient.ts`), with tokens persisted via
   `expo-secure-store` (`src/services/auth/tokenStorage.ts`) instead of
   `LocalStore`. `src/features/auth/repository/index.ts` picks between the
   mock and API implementations based on `env.useMockApi`
   (`src/config/env.ts`) — set `EXPO_PUBLIC_API_BASE_URL` in `.env` to
   switch auth over to a real backend; every other feature keeps using this
   same swap pattern once its own `Api<Feature>Repository` exists.
   `apiClient.ts` also handles the 401 → refresh → retry flow (with a
   request queue so concurrent 401s only trigger one refresh call) and
   automatic logout when refresh fails — see `src/services/auth/authService.ts`.
6. **Replace health adapters** (`src/features/health/adapters/`) one at a
   time: `AppleHealthAdapter`, `GarminAdapter`, `FitbitAdapter`, etc., each
   implementing `HealthPlatformAdapter` and normalizing into the same
   `HealthActivity` / `HealthSleep` / `HealthSteps` / `HealthWeight` /
   `HealthHeartRate` shapes the mock adapter already returns. Register them
   in `HEALTH_ADAPTERS` — nothing else needs to change.
7. **Sync**: `src/services/sync/SyncManager.ts` already models the
   enqueue → flush → mark-synced lifecycle. Point `flush()` at real network
   calls instead of a no-op once repositories talk to a server.

## What must NOT change during migration

- Screen components (`src/screens/**`)
- Shared UI components (`src/components/common/**`)
- Redux slices' shape and action creators
- Selectors (`src/features/*/selectors.ts`)
- Business-logic services (`FastingCalculator`, `NutritionCalculationService`,
  `CalorieCalculationEngine`, `EnergyBalanceEngine`, `DoubleCountingGuard`,
  `MeditationSessionCalculator`, `StreakService`)

If a migration step requires touching any of the files above, the
repository interface was under-specified — fix the interface, not the UI.

## Calculation versioning

`CalorieCalculationEngine` and `EnergyBalanceEngine` already carry a
`calculation_method` / `calculation_version` alongside every computed value
(see `EnergyExpenditure.calculationMethod/calculationVersion` and
`DailyEnergyBalance.calculationVersion`). When the backend takes over these
calculations, keep incrementing the version string so historical values
remain interpretable even after the algorithm changes.
