import React, { useCallback, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { motion } from '@/theme/motion';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { useGoalFlow } from '@/features/onboarding/goals/useGoalFlow';
import { RulerPicker } from '@/features/onboarding/components/RulerPicker';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { onboardingNeutral, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const MIN_H = 120;
const MAX_H = 220;
const DEFAULT_HEIGHT = 170;

// The figure's box used to be a fixed 180x240 — comfortable on a tall
// iPhone, but taller than the leftover space on shorter-viewport Android
// phones, where the ruler + info pill below it got pushed past the
// viewport and required a scroll just to reach them. Now the figure is
// sized as a true remainder: `OnboardingStepLayout` reports the real
// available content height (see its `contentAreaHeight`), this screen
// measures its own ruler+pill block's real height, and the figure gets
// whatever's left between them — clamped so it never gets small enough to
// look like an afterthought or large enough to dominate a tall/tablet
// viewport.
const FIGURE_MIN_HEIGHT = 96;
const FIGURE_MAX_HEIGHT = 240;
const FIGURE_WIDTH_RATIO = 0.75;

export const HeightStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();
  const { totalSteps } = useGoalFlow();
  const heightCm = draft.heightCm ?? DEFAULT_HEIGHT;

  // The ruler + info pill's own natural height — a plain (non-flex)
  // measurement, so unlike a `flex: 1` figure box this settles reliably on
  // the first layout pass on every platform.
  const [belowHeight, setBelowHeight] = useState(0);
  const handleBelowLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setBelowHeight((prev) => (prev === height ? prev : height));
  }, []);

  return (
    <OnboardingStepLayout
      step={4}
      totalSteps={totalSteps}
      title={t('onboarding.height.title')}
      subtitle={t('onboarding.height.subtitle')}
      onNext={() => navigation.navigate('Weight')}
      onBack={() => navigation.goBack()}
      dimBackground
    >
      {(contentAreaHeight) => {
        // Until both real measurements are in (first frame or two), assume
        // the generous max so nothing flashes collapsed — this settles to
        // the true clamped remainder almost immediately, before the
        // screen's own entrance animation makes it visible.
        const figureHeight =
          contentAreaHeight > 0 && belowHeight > 0
            ? Math.max(FIGURE_MIN_HEIGHT, Math.min(contentAreaHeight - belowHeight, FIGURE_MAX_HEIGHT))
            : FIGURE_MAX_HEIGHT;
        const figureWidth = figureHeight * FIGURE_WIDTH_RATIO;

        return (
          <>
            {/* The same persistent character scales vertically in real time
                as the ruler below changes, with faint measurement ticks
                alongside for scale reference. */}
            <View style={{ height: figureHeight, alignItems: 'center', justifyContent: 'center' }}>
              <HumanBodyVisualizer
                gender={draft.gender ?? 'diverse'}
                age={draft.age ?? 27}
                heightCm={heightCm}
                weightKg={draft.weightKg ?? 70}
                showHeightTicks
                width={figureWidth}
                height={figureHeight}
              />
            </View>

            <View onLayout={handleBelowLayout}>
              <RulerPicker min={MIN_H} max={MAX_H} step={1} majorEvery={10} unit="cm" value={heightCm} onChange={(v) => update({ heightCm: v })} />

              {/* Why we're asking — small and secondary by design, sitting right
                  under the input it explains rather than competing with the
                  headline above. Same restrained "info pill" language as other
                  small supporting notes in onboarding, not bare paragraph text. */}
              <FadeSlideIn delay={motion.staggerStepMs * 4} style={{ alignItems: 'center', marginTop: theme.spacing.md }}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    maxWidth: 300,
                    paddingHorizontal: theme.spacing.sm,
                    paddingVertical: 7,
                    borderRadius: theme.radius.pill,
                    backgroundColor: onboardingGlass.fill,
                    borderWidth: 1,
                    borderColor: onboardingGlass.border,
                  }}
                >
                  <View style={{ marginRight: 6 }}>
                    <AppIcon name="flame-outline" size={13} color={onboardingNeutral} />
                  </View>
                  <AppText variant="caption" color={onboardingGlass.textTertiary} style={{ flexShrink: 1, lineHeight: 15 }}>
                    {t('onboarding.height.info')}
                  </AppText>
                </View>
              </FadeSlideIn>
            </View>
          </>
        );
      }}
    </OnboardingStepLayout>
  );
};
