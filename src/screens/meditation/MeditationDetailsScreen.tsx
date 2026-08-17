import React, { useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppEmptyState } from '@/components/common/AppEmptyState';
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
      <>
        <AppHeader title="Meditation" onBack={() => navigation.goBack()} />
        <AppScreen>
          <AppEmptyState title="Meditation unavailable" message="This content may have been deactivated or archived." />
        </AppScreen>
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={meditation.title}
        onBack={() => navigation.goBack()}
        rightElement={
          <Pressable onPress={toggleFavorite} accessibilityRole="button" accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'} hitSlop={8}>
            <AppIcon name={isFavorite ? 'star' : 'star-outline'} size={22} color={isFavorite ? theme.colors.secondary : theme.colors.textSecondary} />
          </Pressable>
        }
      />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          {meditation.description}
        </AppText>
        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.lg }}>
          <Tag label={meditation.category} />
          <Tag label={`${Math.round(meditation.durationSeconds / 60)} min`} />
          <Tag label={meditation.type} />
        </View>
        <AppButton
          label="Start meditation"
          onPress={() => navigation.navigate('MeditationPlayer', { meditationId: meditation.id, type: meditation.type, durationSeconds: meditation.durationSeconds })}
        />
      </AppScreen>
    </>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => {
  const { theme } = useTheme();
  return (
    <View style={{ backgroundColor: theme.colors.primaryMuted, borderRadius: theme.radius.pill, paddingHorizontal: theme.spacing.sm, paddingVertical: 4, marginRight: theme.spacing.xs }}>
      <AppText variant="caption" color={theme.colors.primary} style={{ textTransform: 'capitalize' }}>
        {label}
      </AppText>
    </View>
  );
};
