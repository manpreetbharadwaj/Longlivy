import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationContent, selectMeditationFavorites } from '@/features/meditation/selectors';
import { toggleMeditationFavoriteThunk } from '@/features/meditation/meditationSlice';

export const MeditationDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const route = useRoute<RouteProp<MeditationStackParamList, 'MeditationDetails'>>();
  const dispatch = useAppDispatch();
  const content = useAppSelector(selectMeditationContent);
  const favorites = useAppSelector(selectMeditationFavorites);
  const meditation = content.find((m) => m.id === route.params.meditationId);
  const isFavorite = meditation ? favorites.includes(meditation.id) : false;

  const toggleFavorite = useCallback(() => {
    if (meditation) dispatch(toggleMeditationFavoriteThunk(meditation.id));
  }, [dispatch, meditation]);

  if (!meditation) {
    return (
      <TabHeroLayout title="Meditation" onBack={() => navigation.goBack()}>
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xxl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <AppIcon name="leaf-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Meditation unavailable
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
            This content may have been deactivated or archived.
          </AppText>
        </View>
      </TabHeroLayout>
    );
  }

  return (
    <TabHeroLayout
      title={meditation.title}
      onBack={() => navigation.goBack()}
      rightElement={
        <Pressable onPress={toggleFavorite} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'} hitSlop={8}>
          <AppIcon name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? '#E5BC72' : 'rgba(255,255,255,0.6)'} />
        </Pressable>
      }
    >
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
        {meditation.description}
      </AppText>
      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
        <Tag label={meditation.category} />
        <Tag label={`${Math.round(meditation.durationSeconds / 60)} min`} />
        <Tag label={meditation.type} />
      </View>
      <AppGradientButton
        label="Start meditation"
        onPress={() => navigation.navigate('MeditationPlayer', { meditationId: meditation.id, type: meditation.type, durationSeconds: meditation.durationSeconds })}
        colors={['#A78BC9', '#453569']}
      />
    </TabHeroLayout>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: theme.radius.pill,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        marginRight: theme.spacing.xs,
      }}
    >
      <AppText variant="caption" color="#FFFFFF" style={{ textTransform: 'capitalize' }}>
        {label}
      </AppText>
    </View>
  );
};
