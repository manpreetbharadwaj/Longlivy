import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { aiNutritionRecognitionService } from '@/features/nutrition/services/AiNutritionRecognitionService';

const NUTRITION_GRADIENT = ['#E7A868', '#B4652A'] as const;

interface AiTextVoiceEntryScreenProps {
  mode: 'voice' | 'text';
}

/**
 * Shared shell for the voice and text nutrition entry paths — both ultimately
 * parse a free-text description the same way. "Voice" input uses the same
 * multiline field with dictation via the keyboard's built-in microphone
 * (iOS/Android both support this natively), since a real speech-to-text
 * backend is outside what this client-only prototype can call.
 */
export const AiTextVoiceEntryScreen: React.FC<AiTextVoiceEntryScreenProps> = ({ mode }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleParse = useCallback(() => {
    if (!text.trim()) return;
    setParsing(true);
    const items = aiNutritionRecognitionService.recognizeFromText(text);
    setParsing(false);
    navigation.navigate('AiMealReview', { source: mode, items });
  }, [text, mode, navigation]);

  return (
    <TabHeroLayout title={mode === 'voice' ? 'Voice nutrition' : 'Text nutrition'} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
        {mode === 'voice'
          ? 'Tap the field below, then use your keyboard’s microphone button to dictate a meal — e.g. "two eggs, two slices of wholemeal bread and 200 grams of Skyr."'
          : 'Describe a meal in your own words — e.g. "300 grams of chicken with 150 grams of rice and vegetables."'}
      </AppText>
      <HeroTextField
        value={text}
        onChangeText={setText}
        placeholder={mode === 'voice' ? 'Tap here, then dictate…' : 'Type a meal description…'}
        multiline
        textAlignVertical="top"
        style={{ height: 120, paddingTop: theme.spacing.sm, marginBottom: theme.spacing.md }}
      />
      <AppGradientButton label="Recognize meal" onPress={handleParse} loading={parsing} disabled={!text.trim()} colors={NUTRITION_GRADIENT} />
      <AppText variant="caption" color="rgba(255,255,255,0.5)" align="center" style={{ marginTop: theme.spacing.md }}>
        The structured result will always be editable before saving — nothing is stored automatically.
      </AppText>
    </TabHeroLayout>
  );
};

export const AiVoiceEntryScreen: React.FC = () => <AiTextVoiceEntryScreen mode="voice" />;
export const AiTextEntryScreen: React.FC = () => <AiTextVoiceEntryScreen mode="text" />;
