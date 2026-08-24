import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface HumanBodyVisualizerProps {
  gender: 'female' | 'male' | 'diverse';
  age: number;
  heightCm: number;
  weightKg: number;
  /** Draws faint vertical measurement ticks beside the figure — used only on the Height step. */
  showHeightTicks?: boolean;
  width?: number;
  height?: number;
}

type Gender = 'female' | 'male' | 'diverse';

/** The only age variants that exist — every other age snaps to whichever of these is closest (see `nearestAgeBucket`). */
const AGE_BUCKETS = [18, 28, 38, 48, 58, 68] as const;
type AgeBucket = (typeof AGE_BUCKETS)[number];

/**
 * One static, front-facing photo per gender × age bucket
 * (`assets/images/humans/<gender>/age-<bucket>.png`) — not a live render of
 * any kind, no SVG/Three.js/GLB. Height still applies as `scaleY` and
 * weight as `scaleX` (see the component below) — those stay continuous
 * transforms on top of whichever age image is showing, rather than their
 * own separate image sets, specifically to avoid an age × weight
 * combinatorial asset explosion (6 ages × 3 genders is already 18 files;
 * crossing that with weight buckets too would multiply it further for
 * comparatively little visual benefit over a subtle scale).
 *
 * PLACEHOLDER STATE: every age-bucket file below is currently a resized
 * copy of that gender's single original photo (`assets/images/female.png`
 * etc.) — there is no real per-age artwork yet, so the Age step's slider
 * does not yet visibly age the figure. This file has no image-generation
 * or identity-preserving photo-editing capability available to it, so it
 * cannot produce that artwork itself; the selection/interpolation logic
 * below is fully wired and tested against these placeholders and needs no
 * code changes once real per-age photos replace them — just overwrite the
 * files at the same paths, same names, keeping the same character/outfit/
 * framing so the swap across buckets stays visually consistent.
 */
const SOURCES: Record<Gender, Record<AgeBucket, number>> = {
  female: {
    18: require('../../../../../assets/images/humans/female/age-18.png'),
    28: require('../../../../../assets/images/humans/female/age-28.png'),
    38: require('../../../../../assets/images/humans/female/age-38.png'),
    48: require('../../../../../assets/images/humans/female/age-48.png'),
    58: require('../../../../../assets/images/humans/female/age-58.png'),
    68: require('../../../../../assets/images/humans/female/age-68.png'),
  },
  male: {
    18: require('../../../../../assets/images/humans/male/age-18.png'),
    28: require('../../../../../assets/images/humans/male/age-28.png'),
    38: require('../../../../../assets/images/humans/male/age-38.png'),
    48: require('../../../../../assets/images/humans/male/age-48.png'),
    58: require('../../../../../assets/images/humans/male/age-58.png'),
    68: require('../../../../../assets/images/humans/male/age-68.png'),
  },
  diverse: {
    18: require('../../../../../assets/images/humans/diverse/age-18.png'),
    28: require('../../../../../assets/images/humans/diverse/age-28.png'),
    38: require('../../../../../assets/images/humans/diverse/age-38.png'),
    48: require('../../../../../assets/images/humans/diverse/age-48.png'),
    58: require('../../../../../assets/images/humans/diverse/age-58.png'),
    68: require('../../../../../assets/images/humans/diverse/age-68.png'),
  },
};
// Metro requires every asset path to be a static string literal it can see
// at bundle time — it cannot follow a templated/computed require() — hence
// listing all 18 explicitly above rather than building the table in a
// loop. This does not mean all 18 are ever loaded into memory together:
// `require()` on a local image just resolves Metro's asset id (a cheap,
// synchronous, plain-object lookup), not the pixels — RN's <Image> only
// actually fetches/decodes whichever single `source` is currently
// rendered, i.e. exactly one of these 18 at a time per visible figure.

/**
 * Fraction of each PNG's own canvas height that the actual figure (head to
 * feet) occupies — measured directly off the shipped assets via
 * `PIL.Image.getbbox()` (female 0.986, male 1.0, diverse 1.0 — the female
 * photo has ~14px of transparent margin under the feet at this
 * resolution, the other two have none). `resizeMode="contain"` fits the
 * *whole canvas*, transparent margin included, inside the given box — so
 * on its own it would under-fill the box by exactly this fraction. Used
 * below to inflate the rendered image's height beyond the container's
 * pixel height by `1 / fraction`, so the actual figure (not the padding)
 * matches the intended on-screen size; any transparent margin that
 * overflows the box is invisible and harmless. Recompute if the shipped
 * photos are ever swapped for versions with a different margin.
 */
const CONTENT_HEIGHT_FRACTION: Record<Gender, number> = {
  female: 0.986,
  male: 1,
  diverse: 1,
};

/** The bucket whose age is closest to `age` — ties break toward the younger bucket. */
function nearestAgeBucket(age: number): AgeBucket {
  let closest: AgeBucket = AGE_BUCKETS[0];
  let smallestDiff = Infinity;
  for (const bucket of AGE_BUCKETS) {
    const diff = Math.abs(age - bucket);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closest = bucket;
    }
  }
  return closest;
}

const HeightTicks: React.FC<{ height: number }> = ({ height }) => (
  <Svg width={28} height={height * 0.72} style={{ position: 'absolute', left: 4, bottom: height * 0.16 }} pointerEvents="none">
    {[0, 1, 2, 3, 4].map((i) => (
      <Line key={i} x1={4} y1={(i * (height * 0.72)) / 4} x2={i % 2 === 0 ? 20 : 12} y2={(i * (height * 0.72)) / 4} stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
    ))}
  </Svg>
);

/**
 * The onboarding body visual used across Gender/Age/Height/Weight — a
 * static, non-interactive image (no touch handlers anywhere here: no
 * rotate/drag/pinch/zoom, tapping it does nothing) that:
 *
 *  - gender  → picks the matching photo set
 *  - age     → picks the closest age-bucket photo within that set (see
 *              `nearestAgeBucket`) — the same selection this component
 *              makes on every step (Age/Height/Weight all pass the same
 *              `age` through), so the figure carries the age-appropriate
 *              look forward rather than resetting to a generic image once
 *              the user leaves the Age step
 *  - height  → scales the image vertically (`scaleY`)
 *  - weight  → scales the image horizontally (`scaleX`)
 *
 * Height/weight are driven by `transform` on the UI thread via Reanimated,
 * so dragging those sliders stays smooth — switching the age bucket is a
 * plain (infrequent, discrete) source swap, not animated. Not physically
 * accurate body deformation — a uniform scale on a fixed image — matching
 * the spec: "does not need to be physically accurate, only needs to
 * clearly communicate the selected values."
 *
 * Sized to fill its own box and centered within it; `resizeMode="contain"`
 * fits the source image's real aspect ratio inside that box without
 * cropping, stretching, or squashing, so it stays correct even if the
 * source photos are ever swapped for a different resolution/aspect. The
 * rendered height is inflated slightly beyond the box per
 * `CONTENT_HEIGHT_FRACTION` so each photo's own transparent margin doesn't
 * shrink the visible figure below the box's actual size.
 */
export const HumanBodyVisualizer: React.FC<HumanBodyVisualizerProps> = ({ gender, age, heightCm, weightKg, showHeightTicks, width = 280, height = 340 }) => {
  const heightScale = useSharedValue(1);
  const widthScale = useSharedValue(1);

  useEffect(() => {
    const hFraction = (heightCm - 150) / (195 - 150); // 0 at 150cm, 1 at 195cm
    const clamped = Math.max(0, Math.min(1, hFraction));
    heightScale.value = withSpring(0.88 + clamped * 0.22, { damping: 18, stiffness: 120 });
  }, [heightCm, heightScale]);

  useEffect(() => {
    const wFraction = (weightKg - 45) / (110 - 45); // 0 at 45kg, 1 at 110kg
    const clamped = Math.max(0, Math.min(1.15, wFraction));
    widthScale.value = withSpring(0.88 + clamped * 0.3, { damping: 18, stiffness: 120 });
  }, [weightKg, widthScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: heightScale.value }, { scaleX: widthScale.value }],
  }));

  const source = SOURCES[gender][nearestAgeBucket(age)];
  // Inflate past 100% to compensate for that gender's transparent margin
  // (see CONTENT_HEIGHT_FRACTION) — the margin overflows the box, the
  // figure itself lands at the box's actual height.
  const imageHeightPct = `${100 / CONTENT_HEIGHT_FRACTION[gender]}%` as const;

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      {showHeightTicks ? <HeightTicks height={height} /> : null}
      <Animated.Image source={source} resizeMode="contain" style={[{ width: '100%', height: imageHeightPct }, animatedStyle]} />
    </View>
  );
};
