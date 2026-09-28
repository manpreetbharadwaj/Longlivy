import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { SoundscapePanel, SoundscapeSelection, toSoundscapePlayerParams } from '@/features/meditation/components/SoundscapePanel';

/** Pure nature soundscapes - the direct route from the Meditation landing, Short Sessions and Nature. Renders the same panel as Unguided -> Sounds only. */
export const MeditationSoundscapesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationSoundscapes'>>();

  const start = useCallback((selection: SoundscapeSelection) => navigation.navigate('MeditationPlayer', toSoundscapePlayerParams(selection)), [navigation]);
  const openMeditation = useCallback((meditationId: string) => navigation.navigate('MeditationDetails', { meditationId }), [navigation]);

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.soundscapes.title')} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginBottom: theme.spacing.lg }}>
        {t('meditation.soundscapes.intro')}
      </AppText>
      <View>
        <SoundscapePanel
          initialSoundId={route.params?.soundId}
          initialDurationSeconds={route.params?.durationSeconds}
          allowSilence={route.params?.allowSilence}
          onStart={start}
          onOpenMeditation={openMeditation}
        />
      </View>
    </SectionHeroLayout>
  );
};
