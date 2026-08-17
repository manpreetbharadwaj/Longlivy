import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppIconTile } from '@/components/common/AppIconTile';
import { AppIconName } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { selectTodayMeditationSeconds, selectMeditationStreak, selectFavoriteMeditations } from '@/features/meditation/selectors';

export const MeditationHomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const dispatch = useAppDispatch();
  const todaySeconds = useAppSelector(selectTodayMeditationSeconds);
  const streak = useAppSelector(selectMeditationStreak);
  const favorites = useAppSelector(selectFavoriteMeditations);

  useEffect(() => {
    dispatch(loadMeditationData());
  }, [dispatch]);

  return (
    <AppScreen>
      <AppText variant="displayMedium" style={{ marginBottom: theme.spacing.xs }}>
        Meditation
      </AppText>
      <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
        {todaySeconds > 0 ? `Today: ${Math.round(todaySeconds / 60)} minutes` : 'Not meditating today'}
        {streak > 0 ? ` · ${streak} day streak` : ''}
      </AppText>

      <AppButton
        label="Start meditation"
        onPress={() => navigation.navigate('MeditationCategories')}
        style={{ marginBottom: theme.spacing.md, height: 60 }}
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -theme.spacing.xxs, marginBottom: theme.spacing.md }}>
        <QuickTile icon="hourglass-outline" label="Short (3 min)" onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 180 })} />
        <QuickTile icon="headset-outline" label="Guided" onPress={() => navigation.navigate('MeditationCategories')} />
        <QuickTile icon="pulse-outline" label="Breathing" onPress={() => navigation.navigate('BreathingExercise', { schemeId: 'breath_box' })} />
        <QuickTile icon="leaf-outline" label="Free" onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: 'free', durationSeconds: 600 })} />
      </View>

      {favorites.length > 0 ? (
        <>
          <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
            Favorites
          </AppText>
          {favorites.map((m) => (
            <AppCard
              key={m.id}
              onPress={() => navigation.navigate('MeditationPlayer', { meditationId: m.id, type: m.type, durationSeconds: m.durationSeconds })}
              style={{ marginBottom: theme.spacing.sm }}
            >
              <AppText variant="headingSmall">{m.title}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                {Math.round(m.durationSeconds / 60)} min · {m.category}
              </AppText>
            </AppCard>
          ))}
        </>
      ) : null}

      <View style={{ marginTop: theme.spacing.sm }}>
        <AppButton label="My templates" onPress={() => navigation.navigate('MeditationTemplates')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Goals" onPress={() => navigation.navigate('MeditationGoalsScreen')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="History" onPress={() => navigation.navigate('MeditationHistory')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Statistics" onPress={() => navigation.navigate('MeditationStatistics')} variant="outline" style={{ marginBottom: theme.spacing.xs }} />
        <AppButton label="Reminders" onPress={() => navigation.navigate('MeditationReminders')} variant="ghost" />
      </View>
    </AppScreen>
  );
};

const QuickTile: React.FC<{ icon: AppIconName; label: string; onPress: () => void }> = React.memo(({ icon, label, onPress }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.xs }}>
      <AppCard onPress={onPress} style={{ alignItems: 'center' }}>
        <AppIconTile name={icon} color={theme.colors.meditation} size={40} iconSize={20} />
        <AppText variant="bodySmall" style={{ marginTop: 4 }}>
          {label}
        </AppText>
      </AppCard>
    </View>
  );
});
QuickTile.displayName = 'QuickTile';
