# Activity GPS Tracking Report

## 1. Location library used

The Activity module uses `expo-location` and `watchPositionAsync` for foreground
GPS updates. The tracker requests `Accuracy.BestForNavigation` with a 1-second
time interval and a 1-metre distance interval while an activity is active.

## 2. Permission flow

`SelectActivityScreen` performs a foreground location/service preflight before
the countdown for Running, Walking, Hiking, Cycling, or Jogging. A denied or
blocked permission prevents the countdown and activity record from starting;
the user is told that no fake distance or route will be recorded. Blocked
permissions and disabled location services offer an Open Settings action.
`useGpsTracking` repeats the service, permission, and subscription checks as a
defensive guard and reports denied, unavailable, and poor-signal states in the
live screen.

## 3. GPS sampling settings

- Accuracy: `BestForNavigation`
- Target interval: 1 second
- Distance interval: 1 metre
- Scope: foreground only; no background location task is registered

## 4. Distance calculation

Accepted fixes are accumulated by `GpsSessionTracker` using the Haversine
formula with Earth radius 6,371,000 metres. Distance is stored in metres and
formatted in kilometres for the UI. Persisted route points carry
`segmentStart` markers so pause/resume and signal gaps cannot add a connecting
leg that was not observed.

## 5. GPS filtering rules

- Coordinates and timestamps must be finite and in valid ranges.
- Horizontal accuracy must be positive and at most 35 metres.
- A deadband of 2–6 metres (scaled from reported accuracy) removes duplicates
  and jitter.
- Stationary geographic speeds below 0.3 m/s do not add distance or moving
  time.
- Maximum segment speeds are 6 m/s for Walking/Hiking, 12 m/s for Running/
  Jogging, and 25 m/s for Cycling.
- Out-of-order fixes and impossible jumps are rejected without replacing the
  trusted comparison anchor.
- A gap longer than 15 seconds, an explicit pause, or a resumed screen starts
  a new route segment.
- Elevation gain is included only when both altitude values have altitude
  accuracy of at most 8 metres; gain needs a 3-metre/two-sigma threshold and a
  plausible grade.

## 6. Pace calculation

Average pace is `movingDuration / distanceKm`, formatted as `MM:SS /km`.
Current pace is derived from the smoothed current speed and is withheld until
at least 50 metres are available. Invalid or absurd pace values display
`-- /km`.

## 7. Speed calculation

The engine uses device-reported speed only when the fix is accurate (at most
15 metres), finite, within the activity speed limit, and reasonably agrees
with geographic speed. Otherwise it uses distance divided by timestamp delta.
An exponential moving average (35% new sample) smooths the live value, while
stationary samples decay it toward zero. Average speed uses accepted distance
over accepted moving duration.

## 8. Calorie formula

For GPS sessions, accepted segment MET-hours are integrated and finalized as:

```text
calories = MET-hours × current profile weight in kg
```

The result is an estimate, not a medical-grade measurement. A missing or
invalid weight produces unavailable calories (`null`) rather than silently
using an invented body weight. Manual/no-GPS activities use the same
activity-specific MET estimator over active duration when a real profile weight
is available.

## 9. Activity-specific MET/intensity logic

Running/Jogging, Walking, Hiking, and Cycling use separate speed bands. For
example, faster walking, running, hiking, or cycling selects a higher MET than
the same activity at a slower speed. Stationary segments use a resting MET but
do not contribute moving distance/time. Existing `Other` remains a manual,
non-GPS option.

## 10. Pause/resume behavior

Pause and resume timestamps are persisted. The repository saves the current GPS
checkpoint on pause, excludes the open pause from active duration, and the GPS
engine calls `breakSegment()` so the next fix cannot bridge across the pause.
Ending while paused closes the open pause using the activity's end timestamp,
not storage latency. GPS snapshots and end operations are serialized so a late
snapshot cannot rewrite a completed record.

## 11. Background tracking status

Not implemented. The current implementation is foreground-only by design.
`expo-location.watchPositionAsync` updates are stopped by the platform when the
app is backgrounded; returning to the screen creates a new segment rather than
guessing the route across the gap. No background result has been claimed.

## 12. iOS limitations

The Expo iOS configuration requests `NSLocationWhenInUseUsageDescription` only;
the Always-location and motion usage entries are explicitly disabled. It does
not add a location background mode.
Reliable lock-screen/background workouts would require an explicit background
location design, native configuration, and a persistent workout lifecycle.

## 13. Android limitations

`app.json` declares `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` for
foreground use. There is no `ACCESS_BACKGROUND_LOCATION`, foreground location
service, or persistent workout notification. Reliable background tracking
would require those platform pieces and an OS-version-specific permission
flow.

## 14. Physical-device testing status

No physical-device GPS walk/run was available in this environment. The pure
GPS engine and repository behavior were tested with deterministic coordinates,
timestamps, jumps, stationary fixes, pauses, gaps, altitude, and speed inputs.
Physical outdoor verification is still required for Running, Walking, and
Hiking before treating accuracy as field-validated.

## 15. Remaining limitations

- Background and screen-locked tracking are not supported yet.
- No map component existed in the Activity flow; the ordered real GPS route is
  persisted for a future polyline/detail view.
- GPS/calorie estimates depend on device fix quality and the user's stored
  weight; unavailable inputs remain explicitly unavailable.
- Activity history uses the existing local repository architecture. Old demo
  activity IDs are migrated out and new history starts empty; manual entries
  remain separate with `source: "manual"`.
