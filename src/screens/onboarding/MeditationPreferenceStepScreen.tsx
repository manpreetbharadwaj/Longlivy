import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

export const MeditationPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={8}
      totalSteps={11}
      title="Interested in meditation?"
      subtitle="Guided, free and breathing sessions live in their own space in the app."
      onNext={() => navigation.navigate('NotificationPreferenceStep')}
      onBack={() => navigation.goBack()}
    >
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <AppCard
          onPress={() => update({ meditationInterest: true })}
          style={{ flex: 1, alignItems: 'center', borderColor: draft.meditationInterest ? theme.colors.primary : theme.colors.border, borderWidth: draft.meditationInterest ? 2 : 1 }}
        >
          <AppIconTile name="leaf" color={theme.colors.meditation} size={48} iconSize={24} />
          <AppText variant="headingSmall" style={{ marginTop: theme.spacing.xxs }}>
            Yes, count me in
          </AppText>
        </AppCard>
        <AppCard
          onPress={() => update({ meditationInterest: false })}
          style={{ flex: 1, alignItems: 'center', borderColor: !draft.meditationInterest ? theme.colors.primary : theme.colors.border, borderWidth: !draft.meditationInterest ? 2 : 1 }}
        >
          <AppIconTile name="time-outline" color={theme.colors.textSecondary} size={48} iconSize={24} />
          <AppText variant="headingSmall" style={{ marginTop: theme.spacing.xxs }}>
            Maybe later
          </AppText>
        </AppCard>
      </View>
    </OnboardingStepLayout>
  );
};
