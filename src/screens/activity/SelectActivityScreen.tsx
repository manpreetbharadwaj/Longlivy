import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { ActivityType, ACTIVITY_TYPE_LABELS, SELECTABLE_ACTIVITY_TYPES } from '@/features/activity/models';

// 'hiking' was previously 'trail-sign-outline' (a signpost) — it read as
// "directions" rather than "hiking". 'terrain' (a mountain silhouette, via
// the material-community icon family already used elsewhere in the app)
// reads immediately as hiking/mountain/trail instead.
const ICONS: Record<ActivityType, AppIconName | MaterialCommunityIconName> = {
  running: 'footsteps-outline',
  walking: 'walk-outline',
  cycling: 'bicycle-outline',
  hiking: 'terrain',
  jogging: 'footsteps',
  other: 'barbell-outline',
};
const ICON_FAMILY: Partial<Record<ActivityType, 'material-community'>> = { hiking: 'material-community' };

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
        {SELECTABLE_ACTIVITY_TYPES.map((type) => (
          <View key={type} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
            <HeroCard onPress={() => start(type)} style={{ alignItems: 'center' }}>
              <AppIconTile name={ICONS[type]} family={ICON_FAMILY[type]} color="#FF7A63" size={52} iconSize={26} style={{ marginBottom: theme.spacing.xs }} />
              <AppText variant="headingSmall" color="#FFFFFF">
                {ACTIVITY_TYPE_LABELS[type]}
              </AppText>
            </HeroCard>
          </View>
        ))}
      </View>
    </TabHeroLayout>
  );
};
