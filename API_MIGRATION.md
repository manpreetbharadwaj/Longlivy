# API Migration Plan

The app supports explicit local mock repositories backed by `AsyncStorage`
and a centralized Axios backend path. Nothing in `src/screens`,
`src/features/*/screens`,
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
2. **Add typed Axios service functions** in `src/services/api/` using the
   existing centralized `apiClient.ts`. Keep route constants in
   `apiConfig.ts`, response parsing in the service module, and never call
   Axios directly from screens or Redux reducers.
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
5. **Done for auth, weight, fasting, nutrition and meditation.** Each
   feature has an `Api<Feature>Repository` next to its mock, and the exported
   singleton picks one from `env.useMockApi`. Auth uses `/auth/register`,
   `/auth/login`, `GET /auth/me` (session restore) and `/auth/logout`;
   tokens live in `expo-secure-store` and a 401 clears the session (there is
   no refresh route). The live API is the default; set
   `EXPO_PUBLIC_USE_MOCK_API=true` for the offline prototype. Current status
   per endpoint: `API_INTEGRATION_STATUS.md`.
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
