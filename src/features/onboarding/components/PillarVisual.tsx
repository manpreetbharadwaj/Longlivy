import React from 'react';
import { PillarKey } from '../theme/onboardingTheme';
import { FastingVisual } from './pillarVisuals/FastingVisual';
import { NutritionVisual } from './pillarVisuals/NutritionVisual';
import { ActivityVisual } from './pillarVisuals/ActivityVisual';
import { MindVisual } from './pillarVisuals/MindVisual';

/**
 * The hero visual for one onboarding pillar card — a small "scene" for that
 * part of the product rather than an icon + text, built from the same
 * shared components the real screens use (`AppProgressRing`, `AppProgressBar`,
 * `ActivityFigure`) plus a handful of small ambient-motion helpers
 * (`./pillarVisuals/sceneHelpers.tsx`) reused across all four so the deck
 * reads as one coherent visual system rather than four unrelated animations.
 *
 * Every value shown here is representative sample content for the pre-auth
 * showcase (there's no signed-in user yet to read real numbers from) — the
 * same honesty boundary as the Welcome screen's floating signal chips.
 */
export const PillarVisual: React.FC<{ pillarKey: PillarKey; color: string }> = ({ pillarKey, color }) => {
  switch (pillarKey) {
    case 'fasting':
      return <FastingVisual color={color} />;
    case 'nutrition':
      return <NutritionVisual color={color} />;
    case 'activity':
      return <ActivityVisual color={color} />;
    case 'meditation':
      return <MindVisual color={color} />;
    default:
      return null;
  }
};
