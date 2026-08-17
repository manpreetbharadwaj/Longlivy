import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppSwitch } from '@/components/common/AppSwitch';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { OnboardingStepLayout } from './OnboardingStepLayout';

export const NotificationPreferenceStepScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();
  const { draft, update } = useOnboardingDraft();

  return (
    <OnboardingStepLayout
      step={9}
      totalSteps={11}
      title="Stay in the loop?"
      subtitle="You can fine-tune every notification type later in Settings."
      onNext={() => navigation.navigate('CompleteSetup')}
      onBack={() => navigation.goBack()}
    >
      <AppCard>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: theme.spacing.sm }}>
            <AppText variant="headingSmall">Enable notifications</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              Fasting reminders, streaks and goal updates.
            </AppText>
          </View>
          <AppSwitch value={draft.notificationsEnabled} onValueChange={(v) => update({ notificationsEnabled: v })} />
        </View>
      </AppCard>
    </OnboardingStepLayout>
  );
};
