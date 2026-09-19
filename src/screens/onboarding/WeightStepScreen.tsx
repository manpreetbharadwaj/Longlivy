import React from 'react';
import { View } from 'react-native';
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
import { RulerPicker } from '@/features/onboarding/components/RulerPicker';
import { HumanBodyVisualizer } from '@/features/onboarding/components/three/HumanBodyVisualizer';
import { onboardingNeutral, onboardingGlass } from '@/features/onboarding/theme/onboardingTheme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const DEFAULT_WEIGHT = 70;

export const WeightStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { draft, update } = useOnboardingDraft();
  const weightKg = draft.weightKg ?? DEFAULT_WEIGHT;

  return (
    <OnboardingStepLayout
      step={5}
      totalSteps={7}
      title={t('onboarding.weight.title')}
      subtitle={t('onboarding.weight.subtitle')}
      onNext={() => navigation.navigate('ActivityLevelStep')}
      onBack={() => navigation.goBack()}
      dimBackground
    >
      {/* Same persistent character, still carrying gender/age/height from the earlier
          steps — only weight moves the body-volume morph here. Sized down slightly
          from the Height step's figure (150x190 vs 180x240): the figure is the one
          element on this screen with real slack to give up, so both explanatory
          notes below can fit on one screen on most devices without scrolling. */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <HumanBodyVisualizer gender={draft.gender ?? 'diverse'} age={draft.age ?? 27} heightCm={draft.heightCm ?? 170} weightKg={weightKg} width={150} height={190} />
      </View>
      <RulerPicker min={35} max={180} step={1} majorEvery={10} unit="kg" value={weightKg} onChange={(v) => update({ weightKg: v })} />

      {/* Why we're asking — same restrained "info pill" language introduced on the
          Height step, reused here rather than inventing a new style. */}
      <FadeSlideIn delay={motion.staggerStepMs * 4} style={{ alignItems: 'center', marginTop: theme.spacing.sm }}>
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
            <AppIcon name="body-outline" size={13} color={onboardingNeutral} />
          </View>
          <AppText variant="caption" color={onboardingGlass.textTertiary} style={{ flexShrink: 1, lineHeight: 15 }}>
            {t('onboarding.weight.info')}
          </AppText>
        </View>
      </FadeSlideIn>

      {/* The existing reassurance line — kept exactly as before (the client likes
          it and doesn't want it removed), just given a tighter margin above it so
          both notes plus the CTA fit without needing to scroll. */}
      <AppText variant="caption" color={onboardingGlass.textTertiary} align="center" style={{ marginTop: theme.spacing.xs }}>
        {t('onboarding.weight.reassurance')}
      </AppText>
    </OnboardingStepLayout>
  );
};
