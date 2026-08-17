import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '@/navigation/types';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { ColorTokens } from '@/theme';
import { OnboardingStepLayout } from './OnboardingStepLayout';

const PILLARS: { icon: AppIconName; title: string; desc: string; color: keyof ColorTokens }[] = [
  { icon: 'timer-outline', title: 'Fasting', desc: 'Plan, track and understand your fasting rhythm.', color: 'fasting' },
  { icon: 'restaurant-outline', title: 'Nutrition', desc: 'Log meals and see calories and macros in context.', color: 'nutrition' },
  { icon: 'walk-outline', title: 'Activity', desc: 'Track workouts and see how they affect your balance.', color: 'activity' },
  { icon: 'leaf-outline', title: 'Meditation', desc: 'Short or long sessions, at your own pace.', color: 'meditation' },
];

export const WhatIsLonglivyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<OnboardingStackParamList>>();
  const { theme } = useTheme();

  return (
    <OnboardingStepLayout
      step={1}
      totalSteps={11}
      title="What is Longlivy?"
      subtitle="Four connected areas, one daily picture."
      onNext={() => navigation.navigate('TrackingOverview')}
      onBack={() => navigation.goBack()}
    >
      {PILLARS.map((p) => (
        <AppCard key={p.title} style={{ marginBottom: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AppIconTile name={p.icon} color={theme.colors[p.color]} size={48} iconSize={24} style={{ marginRight: theme.spacing.sm }} />
            <View style={{ flex: 1 }}>
              <AppText variant="headingSmall">{p.title}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                {p.desc}
              </AppText>
            </View>
          </View>
        </AppCard>
      ))}
    </OnboardingStepLayout>
  );
};
