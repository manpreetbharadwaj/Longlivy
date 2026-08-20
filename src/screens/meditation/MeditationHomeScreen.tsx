import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
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
    <TabHeroLayout title="Meditation">
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginBottom: theme.spacing.md }}>
        {todaySeconds > 0 ? `Today: ${Math.round(todaySeconds / 60)} minutes` : 'Not meditating today'}
        {streak > 0 ? ` · ${streak} day streak` : ''}
      </AppText>

      <AppGradientButton
        label="Start meditation"
        onPress={() => navigation.navigate('MeditationCategories')}
        colors={['#B98CE0', '#4A3A7A']}
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
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
            Favorites
          </AppText>
          {favorites.map((m) => (
            <HeroCard
              key={m.id}
              onPress={() => navigation.navigate('MeditationPlayer', { meditationId: m.id, type: m.type, durationSeconds: m.durationSeconds })}
              style={{ marginBottom: theme.spacing.sm }}
            >
              <AppText variant="headingSmall" color="#FFFFFF">
                {m.title}
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                {Math.round(m.durationSeconds / 60)} min · {m.category}
              </AppText>
            </HeroCard>
          ))}
        </>
      ) : null}

      <View style={{ marginTop: theme.spacing.sm }}>
        <HeroCard onPress={() => navigation.navigate('MeditationTemplates')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            My templates
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MeditationGoalsScreen')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Goals
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MeditationHistory')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            History
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MeditationStatistics')} style={{ marginBottom: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            Statistics
          </AppText>
        </HeroCard>
        <HeroCard onPress={() => navigation.navigate('MeditationReminders')} style={{ paddingVertical: theme.spacing.sm }}>
          <AppText variant="headingSmall" color="rgba(255,255,255,0.7)" align="center">
            Reminders
          </AppText>
        </HeroCard>
      </View>
    </TabHeroLayout>
  );
};

const QuickTile: React.FC<{ icon: AppIconName; label: string; onPress: () => void }> = React.memo(({ icon, label, onPress }) => {
  const { theme } = useTheme();
  return (
    <View style={{ width: '50%', paddingHorizontal: theme.spacing.xxs, marginBottom: theme.spacing.xs }}>
      <HeroCard onPress={onPress} style={{ alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: theme.radius.md,
            backgroundColor: 'rgba(185,140,224,0.18)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name={icon} size={20} color="#B98CE0" />
        </View>
        <AppText variant="bodySmall" color="#FFFFFF" style={{ marginTop: 4 }}>
          {label}
        </AppText>
      </HeroCard>
    </View>
  );
});
QuickTile.displayName = 'QuickTile';
