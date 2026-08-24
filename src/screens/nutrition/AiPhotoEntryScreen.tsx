import React, { useCallback, useState } from 'react';
import { View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { aiNutritionRecognitionService } from '@/features/nutrition/services/AiNutritionRecognitionService';

const NUTRITION_GRADIENT = ['#E0AC55', '#8F6A2E'] as const;

export const AiPhotoEntryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);

  const capture = useCallback(async (source: 'camera' | 'library') => {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.6, allowsEditing: true, mediaTypes: ['images'] });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const recognize = useCallback(() => {
    setRecognizing(true);
    // Stands in for a real vision model call — see AiNutritionRecognitionService.
    const items = aiNutritionRecognitionService.recognizeFromPhoto();
    setRecognizing(false);
    navigation.navigate('AiMealReview', { source: 'photo', items });
  }, [navigation]);

  return (
    <TabHeroLayout title="Photo nutrition" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
        Take a photo of a meal and let AI suggest foods, portions and quantities. You'll always review and
        confirm the result before anything is saved.
      </AppText>

      {photoUri ? (
        <FadeSlideIn delay={0}>
          <HeroCard style={{ marginBottom: theme.spacing.md, overflow: 'hidden', padding: 0 }}>
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          </HeroCard>
        </FadeSlideIn>
      ) : (
        <View
          style={{
            height: 220,
            borderRadius: theme.radius.lg,
            borderWidth: 1.5,
            borderColor: 'rgba(255,255,255,0.16)',
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
          }}
        >
          <AppIcon name="image-outline" size={32} color="rgba(255,255,255,0.5)" />
          <AppText variant="bodySmall" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.xs }}>
            No photo yet
          </AppText>
        </View>
      )}

      <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md, gap: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => capture('camera')} style={{ paddingVertical: theme.spacing.sm }} scaleOnPress>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              Take photo
            </AppText>
          </HeroCard>
        </View>
        <View style={{ flex: 1 }}>
          <HeroCard onPress={() => capture('library')} style={{ paddingVertical: theme.spacing.sm }} scaleOnPress>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              Choose from library
            </AppText>
          </HeroCard>
        </View>
      </View>

      <AppGradientButton label="Recognize meal" onPress={recognize} loading={recognizing} disabled={!photoUri} colors={NUTRITION_GRADIENT} />

      <AppText variant="caption" color="rgba(255,255,255,0.5)" align="center" style={{ marginTop: theme.spacing.md }}>
        AI recognition will always require your review and confirmation before anything is saved — never
        stored directly as a final entry.
      </AppText>
    </TabHeroLayout>
  );
};
