import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ActivityStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch } from '@/store/hooks';
import { startActivityThunk } from '@/features/activity/activitySlice';
import { ActivityType, ACTIVITY_TYPE_LABELS, GPS_BASED_TYPES } from '@/features/activity/models';

const ICONS: Record<ActivityType, AppIconName> = {
  running: 'footsteps-outline',
  walking: 'walk-outline',
  cycling: 'bicycle-outline',
  hiking: 'trail-sign-outline',
  jogging: 'footsteps',
  other: 'barbell-outline',
};

export const SelectActivityScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ActivityStackParamList>>();
  const dispatch = useAppDispatch();

  const start = useCallback(
    async (type: ActivityType) => {
      const gpsAvailable = GPS_BASED_TYPES.includes(type);
      await dispatch(startActivityThunk({ type, gpsAvailable }));
      navigation.replace('ActiveActivity');
    },
    [dispatch, navigation]
  );

  return (
    <>
      <AppHeader title="Choose activity" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs }}>
          {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((type) => (
            <View key={type} style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.sm }}>
              <AppCard onPress={() => start(type)} style={{ alignItems: 'center' }}>
                <AppIconTile name={ICONS[type]} color={theme.colors.activity} size={52} iconSize={26} style={{ marginBottom: theme.spacing.xs }} />
                <AppText variant="headingSmall">{ACTIVITY_TYPE_LABELS[type]}</AppText>
              </AppCard>
            </View>
          ))}
        </View>
      </AppScreen>
    </>
  );
};
