import React, { useCallback, useState } from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { GenderCard } from '@/features/onboarding/components/GenderCard';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { OnboardingStepLayout } from './OnboardingStepLayout';

// Order is client-specified and load-bearing: Male, then Female, then
// Diverse / Other — do not reorder. Labels resolved at render via
// `t('enums.gender.<key>')`.
const OPTION_KEYS = ['male', 'female', 'diverse'] as const;

// HumanBodyVisualizer defaults to a fixed 280x340 box when no width/height
// is passed — comfortable on a tall iPhone, but combined with the gender
// row's own fixed 160px min-height, that's more than several shorter
// Android/iPhone viewports have room for, which is what forced this screen
// to scroll. Sized as a true remainder instead (see figureHeight below),
// same approach as the Height/Weight steps' body visualizer, clamped so it
// never gets small enough to look like an afterthought or large enough to
// dominate a tall/tablet viewport.
const FIGURE_MIN_HEIGHT = 96;
// Raised from the Height/Weight steps' 240 cap — the gender row is now
// noticeably smaller (see GenderCard's own trimmed sizing), so there's
// genuinely more remainder to give the character on a tall device; this
// cap is what lets it actually use that space instead of stopping short.
const FIGURE_MAX_HEIGHT = 300;
const FIGURE_WIDTH_RATIO = 0.75;

export const GenderStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();

  // The gender row's own natural height — a plain (non-flex) measurement,
  // so unlike a `flex: 1` figure box this settles reliably on the first
  // layout pass on every platform.
  const [aboveHeight, setAboveHeight] = useState(0);
  const handleAboveLayout = useCallback((e: LayoutChangeEvent) => {
    const { height } = e.nativeEvent.layout;
    setAboveHeight((prev) => (prev === height ? prev : height));
  }, []);

  return (
    <OnboardingStepLayout
      step={2}
      totalSteps={7}
      title={t('onboarding.gender.title')}
      subtitle={t('onboarding.gender.subtitle')}
      onNext={() => navigation.navigate('Age')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.gender}
      dimBackground
    >
      {(contentAreaHeight) => {
        // Until both real measurements are in (first frame or two), assume
        // the generous max so nothing flashes collapsed — this settles to
        // the true clamped remainder almost immediately, before the
        // screen's own entrance animation makes it visible.
        const figureHeight =
          contentAreaHeight > 0 && aboveHeight > 0
            ? Math.max(FIGURE_MIN_HEIGHT, Math.min(contentAreaHeight - aboveHeight, FIGURE_MAX_HEIGHT))
            : FIGURE_MAX_HEIGHT;
        const figureWidth = figureHeight * FIGURE_WIDTH_RATIO;

        return (
          <>
            <View onLayout={handleAboveLayout} style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
              {OPTION_KEYS.map((key) => (
                <GenderCard key={key} kind={key} label={t(`enums.gender.${key}`)} selected={draft.gender === key} onPress={() => update({ gender: key })} />
              ))}
            </View>

            {/* The empty lower area becomes the start of the user's digital
                profile — a non-interactive body silhouette that carries
                forward, gradually filled in, through Age/Height/Weight. */}
            <View style={{ height: figureHeight, alignItems: 'center', justifyContent: 'center', marginTop: theme.spacing.sm }}>
              <HumanBodyVisualizer
                gender={draft.gender ?? 'diverse'}
                age={draft.age ?? 27}
                heightCm={draft.heightCm ?? 170}
                weightKg={draft.weightKg ?? 70}
                width={figureWidth}
                height={figureHeight}
              />
            </View>
          </>
        );
      }}
    </OnboardingStepLayout>
  );
};
