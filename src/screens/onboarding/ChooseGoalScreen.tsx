import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft, OnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const GOALS: { key: NonNullable<OnboardingDraft['goal']>; label: string; icon: AppIconName }[] = [
  { key: 'weight_loss', label: 'Weight loss', icon: 'trending-down-outline' },
  { key: 'maintenance', label: 'Weight maintenance', icon: 'scale-outline' },
  { key: 'general_wellness', label: 'General wellness', icon: 'leaf-outline' },
  { key: 'muscle_gain', label: 'Muscle gain', icon: 'barbell-outline' },
];

export const ChooseGoalScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  const select = useCallback((goal: OnboardingDraft['goal']) => update({ goal }), [update]);

  return (
    <OnboardingStepLayout
      step={3}
      totalSteps={11}
      title="What's your primary goal?"
      subtitle="This shapes your default calorie and macro targets — you can change it anytime."
      onNext={() => navigation.navigate('PersonalInfo')}
      onBack={() => navigation.goBack()}
      nextDisabled={!draft.goal}
    >
      {GOALS.map((g) => (
        <AppCard key={g.key} onPress={() => select(g.key)} style={{ marginBottom: theme.spacing.sm, borderColor: draft.goal === g.key ? theme.colors.primary : theme.colors.border, borderWidth: draft.goal === g.key ? 2 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIconTile name={g.icon} color={theme.colors.primary} size={44} iconSize={22} style={{ marginRight: theme.spacing.sm }} />
            <AppText variant="headingSmall">{g.label}</AppText>
          </View>
        </AppCard>
      ))}
    </OnboardingStepLayout>
  );
};
