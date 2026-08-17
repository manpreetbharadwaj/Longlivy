import React, { useCallback, useState } from 'react';
import { View, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { aiNutritionRecognitionService } from '@/features/nutrition/services/AiNutritionRecognitionService';

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
    <>
      <AppHeader title="Photo nutrition" onBack={() => navigation.goBack()} />
      <AppScreen>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
          Take a photo of a meal and let AI suggest foods, portions and quantities. You'll always review and
          confirm the result before anything is saved.
        </AppText>

        {photoUri ? (
          <AppCard style={{ marginBottom: theme.spacing.md, overflow: 'hidden' }} padded={false}>
            <Image source={{ uri: photoUri }} style={{ width: '100%', height: 220 }} resizeMode="cover" />
          </AppCard>
        ) : (
          <View
            style={{
              height: 220,
              borderRadius: theme.radius.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderStyle: 'dashed',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <AppIcon name="image-outline" size={32} color={theme.colors.textTertiary} />
            <AppText variant="bodySmall" color={theme.colors.textTertiary} style={{ marginTop: theme.spacing.xs }}>
              No photo yet
            </AppText>
          </View>
        )}

        <View style={{ flexDirection: 'row', marginBottom: theme.spacing.md }}>
          <AppButton label="Take photo" onPress={() => capture('camera')} variant="outline" style={{ flex: 1, marginRight: theme.spacing.xs }} />
          <AppButton label="Choose from library" onPress={() => capture('library')} variant="outline" style={{ flex: 1 }} />
        </View>

        <AppButton label="Recognize meal" onPress={recognize} loading={recognizing} disabled={!photoUri} />

        <AppText variant="caption" color={theme.colors.textTertiary} align="center" style={{ marginTop: theme.spacing.md }}>
          AI recognition will always require your review and confirmation before anything is saved — never
          stored directly as a final entry.
        </AppText>
      </AppScreen>
    </>
  );
};
