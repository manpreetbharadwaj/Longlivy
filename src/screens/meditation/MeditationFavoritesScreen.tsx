import React from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppSelector } from '@/store/hooks';
import { selectFavoriteMeditations } from '@/features/meditation/selectors';
import { getMeditationTopicLabel } from '@/features/meditation/meditationTaxonomy';

export const MeditationFavoritesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const favorites = useAppSelector(selectFavoriteMeditations);

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.favoritesScreen.title')} onBack={() => navigation.goBack()} scroll={false}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HeroCard
            onPress={() => navigation.navigate('MeditationPlayer', { meditationId: item.id, type: item.type, durationSeconds: item.durationSeconds })}
            style={{ marginBottom: theme.spacing.sm }}
          >
            <AppText variant="headingSmall" color="#FFFFFF">
              {item.title}
            </AppText>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
              {Math.round(item.durationSeconds / 60)} min · {getMeditationTopicLabel(item.category, t)}
              {item.availability === 'coming_soon' ? ` · ${t('meditation.details.comingSoon')}` : ''}
            </AppText>
          </HeroCard>
        )}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing.xxl }}>
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
              <AppIcon name="star-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              {t('meditation.favoritesScreen.empty')}
            </AppText>
          </View>
        }
      />
    </SectionHeroLayout>
  );
};
