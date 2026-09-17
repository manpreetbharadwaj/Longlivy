import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { ProfileStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { HeroOptionCard } from '@/components/common/HeroOptionCard';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { FeedbackCategory } from '@/features/feedback/models';
import { feedbackRepository } from '@/features/feedback/repository/MockFeedbackRepository';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

const CATEGORIES: { key: FeedbackCategory; icon: 'bulb-outline' | 'bug-outline' | 'sparkles-outline' | 'chatbubbles-outline'; titleKey: TranslationKey; descriptionKey: TranslationKey }[] = [
  { key: 'improvement', icon: 'bulb-outline', titleKey: 'feedback.category.improvement.title', descriptionKey: 'feedback.category.improvement.description' },
  { key: 'bug', icon: 'bug-outline', titleKey: 'feedback.category.bug.title', descriptionKey: 'feedback.category.bug.description' },
  { key: 'feature', icon: 'sparkles-outline', titleKey: 'feedback.category.feature.title', descriptionKey: 'feedback.category.feature.description' },
  { key: 'general', icon: 'chatbubbles-outline', titleKey: 'feedback.category.general.title', descriptionKey: 'feedback.category.general.description' },
];

type SubmitStatus = 'idle' | 'submitting' | 'success';

export const FeedbackScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const [category, setCategory] = useState<FeedbackCategory>('improvement');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [showValidation, setShowValidation] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      setShowValidation(true);
      return;
    }
    setShowValidation(false);
    setStatus('submitting');
    await feedbackRepository.submit(DEMO_USER_ID, { category, message: message.trim() });
    setStatus('success');
  };

  if (status === 'success') {
    return (
      <TabHeroLayout scroll={false}>
        <FeedbackSuccess onDone={() => navigation.goBack()} />
      </TabHeroLayout>
    );
  }

  return (
    <TabHeroLayout title={t('feedback.title')} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginBottom: theme.spacing.lg }}>
        {t('feedback.intro')}
      </AppText>

      <View style={{ marginBottom: theme.spacing.lg }}>
        {CATEGORIES.map((c, index) => (
          <FadeSlideIn key={c.key} delay={index * motion.staggerStepMs} fromY={8} style={{ marginBottom: theme.spacing.sm }}>
            <HeroOptionCard
              icon={c.icon}
              title={t(c.titleKey)}
              description={t(c.descriptionKey)}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          </FadeSlideIn>
        ))}
      </View>

      <HeroTextField
        label={t('feedback.messageLabel')}
        placeholder={t('feedback.messagePlaceholder')}
        value={message}
        onChangeText={(v) => {
          setMessage(v);
          if (showValidation && v.trim()) setShowValidation(false);
        }}
        multiline
        numberOfLines={6}
        style={{ height: 140, paddingTop: theme.spacing.sm, textAlignVertical: 'top' }}
      />
      {showValidation ? (
        <AppText variant="caption" color={dashboardColors.warning} style={{ marginTop: theme.spacing.xs }}>
          {t('feedback.validationRequired')}
        </AppText>
      ) : null}

      <AppGradientButton
        label={status === 'submitting' ? t('feedback.submitting') : t('feedback.submit')}
        loading={status === 'submitting'}
        onPress={handleSubmit}
        style={{ marginTop: theme.spacing.xl }}
      />
    </TabHeroLayout>
  );
};

/** Same glow/ring technique as ProfileScreen's avatar — checkmark instead of an initial. */
const FeedbackSuccess: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const glow = useSharedValue(0);

  useEffect(() => {
    glow.value = withDelay(
      200,
      withRepeat(withSequence(withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }), withTiming(0, { duration: motion.duration.ambient, easing: motion.easing.standard })), -1, true)
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.7 + glow.value * 0.3 }));

  const size = 108;
  const frame = size + 24;
  const glowSize = frame * 1.7;

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: theme.spacing.xxxl }}>
      <View style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={glowSize} color={dashboardColors.success} opacity={0.22} pulse style={{ top: (frame - glowSize) / 2, left: (frame - glowSize) / 2 }} />
        <Svg width={frame} height={frame} style={{ position: 'absolute' }}>
          <Circle cx={frame / 2} cy={frame / 2} r={frame / 2 - 2} stroke={dashboardColors.border} strokeWidth={1} fill="none" />
        </Svg>
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: dashboardColors.surfaceElevated,
              borderWidth: 2,
              borderColor: dashboardColors.success,
              alignItems: 'center',
              justifyContent: 'center',
            },
            glowStyle,
          ]}
        >
          <AppIcon name="checkmark" size={44} color={dashboardColors.success} />
        </Animated.View>
      </View>

      <FadeSlideIn delay={motion.staggerStepMs} style={{ alignItems: 'center', marginTop: theme.spacing.lg }}>
        <AppText variant="headingLarge" color={dashboardColors.textPrimary} align="center">
          {t('feedback.success.title')}
        </AppText>
        <AppText variant="bodyMedium" color={dashboardColors.textSecondary} align="center" style={{ marginTop: theme.spacing.xs, maxWidth: 280 }}>
          {t('feedback.success.body')}
        </AppText>
      </FadeSlideIn>

      <FadeSlideIn delay={2 * motion.staggerStepMs} style={{ alignSelf: 'stretch', marginTop: theme.spacing.xl }}>
        <AppGradientButton label={t('feedback.success.done')} onPress={onDone} />
      </FadeSlideIn>
    </View>
  );
};
