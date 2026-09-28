import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { AppText } from '@/components/common/AppText';
import { SceneCard } from '@/components/common/SceneCard';
import { useTheme } from '@/hooks/useTheme';
import { ActivityType, ACTIVITY_TYPE_LABELS, SELECTABLE_ACTIVITY_TYPES } from '@/features/activity/models';
import { ActivityArt, getActivityArtKind } from '@/features/activity/components/ActivityArt';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';

const SUBTITLES: Record<ActivityType, string> = {
  running: 'Pace and distance',
  walking: 'Steady steps',
  cycling: 'Distance and speed',
  hiking: 'Routes and elevation',
  jogging: 'Pace and distance',
  other: 'Log any workout',
};

export const SelectActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();

  // Choosing a type no longer starts the real Activity — it only hands the
  // type to the pre-start countdown on ActiveActivityScreen. The workout
  // timer, distance, calories and GPS route only begin at "Go" (see
  // useActivityCountdown / ActiveActivityScreen), so tapping "Start Run"
  // here must not itself mean duration has begun.
  const start = useCallback(
    (type: ActivityType) => {
      navigation.replace('ActiveActivity', { pendingType: type });
    },
    [navigation]
  );

  return (
    <TabHeroLayout title="Choose activity" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color={dashboardColors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
        What are you doing today? Tracking starts after a short countdown.
      </AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
        {SELECTABLE_ACTIVITY_TYPES.map((type) => (
          <View key={type} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
            <SceneCard
              art={<ActivityArt kind={getActivityArtKind(type)} />}
              title={ACTIVITY_TYPE_LABELS[type]}
              subtitle={SUBTITLES[type]}
              height={148}
              onPress={() => start(type)}
              accessibilityLabel={`${ACTIVITY_TYPE_LABELS[type]}. ${SUBTITLES[type]}`}
              style={{ flex: undefined, width: '100%' }}
            />
          </View>
        ))}
      </View>
    </TabHeroLayout>
  );
};
