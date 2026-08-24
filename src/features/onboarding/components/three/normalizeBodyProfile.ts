import { NormalizedBodyProfile } from './HumanFigureMesh';

export interface RawBodyProfile {
  gender: 'female' | 'male' | 'diverse';
  age: number;
  heightCm: number;
  weightKg: number;
  /** Optional — not collected by the current (deliberately short) onboarding flow, but the visualizer and normalizer support it for when/if it is. */
  bodyFatPercent?: number;
  /** Optional — same note as `bodyFatPercent`. */
  muscleMass?: number;
  /** Optional — same note as `bodyFatPercent`. */
  waistCm?: number;
}

const AGE_RANGE = [13, 85] as const;
const HEIGHT_RANGE = [140, 205] as const;
const WEIGHT_RANGE = [40, 130] as const;
const BODY_FAT_RANGE = [8, 35] as const;
const MUSCLE_RANGE = [0, 100] as const;
const WAIST_RANGE = [60, 130] as const;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function normalize(value: number, [min, max]: readonly [number, number]): number {
  return clamp01((value - min) / (max - min));
}

/**
 * The one place raw onboarding/profile values become the 0..1 parameters
 * the 3D renderer actually consumes — kept engine-agnostic (plain numbers
 * in, plain numbers out) so a future web visualizer can reuse it unchanged.
 * Body-fat/muscle/waist default to population-average normalized values
 * (0.4) when not supplied, so the figure still reads sensibly for a flow
 * that only collects weight.
 */
export function normalizeBodyProfile(raw: RawBodyProfile): NormalizedBodyProfile {
  const genderBlend = raw.gender === 'male' ? 1 : raw.gender === 'female' ? 0 : 0.5;
  const normalizedWeight = normalize(raw.weightKg, WEIGHT_RANGE);
  const normalizedBodyFat = raw.bodyFatPercent != null ? normalize(raw.bodyFatPercent, BODY_FAT_RANGE) : 0.4;

  return {
    genderBlend,
    age: normalize(raw.age, AGE_RANGE),
    height: normalize(raw.heightCm, HEIGHT_RANGE),
    // Weight and body fat both express as overall body volume — averaged
    // rather than summed, so supplying only one doesn't double-count.
    volume: clamp01(normalizedWeight * 0.6 + normalizedBodyFat * 0.4),
    muscle: raw.muscleMass != null ? normalize(raw.muscleMass, MUSCLE_RANGE) : 0.4,
    waist: raw.waistCm != null ? normalize(raw.waistCm, WAIST_RANGE) : normalizedWeight,
  };
}
