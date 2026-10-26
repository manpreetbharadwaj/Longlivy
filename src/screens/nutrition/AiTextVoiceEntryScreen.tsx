import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NutritionStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppIcon } from '@/components/common/AppIcon';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { aiNutritionRecognitionService } from '@/features/nutrition/services/AiNutritionRecognitionService';
import { useVoiceTranscription } from '@/features/nutrition/hooks/useVoiceTranscription';

const NUTRITION_GRADIENT = ['#C9974E', '#8F6A2E'] as const;

interface AiTextVoiceEntryScreenProps {
  mode: 'voice' | 'text';
}

const VOICE_STATUS_LABEL: Record<string, string> = {
  idle: '',
  requesting_permission: 'Requesting microphone access…',
  listening: 'Listening…',
  no_speech: 'No speech detected',
  permission_denied: 'Microphone permission needed',
  network_unavailable: 'Network unavailable',
  error: 'Speech recognition failed',
  unsupported: 'Speech recognition unavailable on this device',
};

/**
 * Shared shell for the voice and text nutrition entry paths — both ultimately
 * parse a free-text description the same way. Voice mode transcribes live
 * with the device's own native speech recognizer (no server, no cost); text
 * mode is a plain editable field. Either way, the recognized text always
 * goes through the same food matcher and the same human review step before
 * anything is saved.
 */
export const AiTextVoiceEntryScreen: React.FC<AiTextVoiceEntryScreenProps> = ({ mode }) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<NutritionStackParamList>>();
  const [typedText, setTypedText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [noMatch, setNoMatch] = useState(false);
  const voice = useVoiceTranscription();
  // Voice mode's field always reflects live recognition (or the user's edit
  // of it, tracked inside the hook) — no separate copy to keep in sync.
  const text = mode === 'voice' ? voice.transcript : typedText;

  useEffect(() => {
    if (mode !== 'voice') return;
    return () => voice.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleTextChange = useCallback(
    (value: string) => {
      if (mode === 'voice') voice.setTranscript(value);
      else setTypedText(value);
    },
    [mode, voice]
  );

  const handleMicPress = useCallback(() => {
    if (voice.status === 'listening') voice.stop();
    else void voice.start();
  }, [voice]);

  const handleParse = useCallback(() => {
    if (!text.trim()) return;
    if (voice.status === 'listening') voice.stop();
    setParsing(true);
    const items = aiNutritionRecognitionService.recognizeFromText(text);
    setParsing(false);
    setNoMatch(items.length === 0);
    if (items.length > 0) navigation.navigate('AiMealReview', { source: mode, items });
  }, [text, mode, navigation, voice]);

  const statusLabel = VOICE_STATUS_LABEL[voice.status] ?? '';
  const listening = voice.status === 'listening';

  return (
    <TabHeroLayout title={mode === 'voice' ? 'Voice nutrition' : 'Text nutrition'} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginBottom: theme.spacing.md }}>
        {mode === 'voice'
          ? 'Tap the microphone and describe a meal — e.g. "two boiled eggs, three slices of bread and a glass of milk."'
          : 'Describe a meal in your own words — e.g. "300 grams of chicken with 150 grams of rice and vegetables."'}
      </AppText>

      {mode === 'voice' ? (
        <View style={{ alignItems: 'center', marginBottom: theme.spacing.md }}>
          <Pressable
            onPress={handleMicPress}
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Stop listening' : 'Start listening'}
            style={({ pressed }) => ({
              width: 76,
              height: 76,
              borderRadius: 38,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: listening ? NUTRITION_GRADIENT[0] : 'rgba(255,255,255,0.08)',
              borderWidth: 1.5,
              borderColor: listening ? NUTRITION_GRADIENT[0] : 'rgba(255,255,255,0.2)',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <AppIcon name={listening ? 'mic' : 'mic-outline'} size={32} color="#FFFFFF" />
          </Pressable>
          {statusLabel ? (
            <AppText
              variant="bodySmall"
              color={voice.status === 'listening' ? NUTRITION_GRADIENT[0] : 'rgba(255,255,255,0.6)'}
              style={{ marginTop: theme.spacing.xs }}
            >
              {statusLabel}
            </AppText>
          ) : null}
          {voice.message ? (
            <AppText variant="caption" color="#F2A08F" align="center" style={{ marginTop: 2, paddingHorizontal: theme.spacing.lg }}>
              {voice.message}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <HeroTextField
        value={text}
        onChangeText={handleTextChange}
        placeholder={mode === 'voice' ? 'What the microphone hears appears here…' : 'Type a meal description…'}
        multiline
        textAlignVertical="top"
        style={{ height: 120, paddingTop: theme.spacing.sm, marginBottom: theme.spacing.md }}
      />
      <AppGradientButton label="Recognize meal" onPress={handleParse} loading={parsing} disabled={!text.trim()} colors={NUTRITION_GRADIENT} />
      {noMatch ? (
        <AppText variant="bodySmall" color="#F2A08F" align="center" style={{ marginTop: theme.spacing.sm }}>
          No foods recognized. Name the foods (e.g. "banana", "rice") or add them manually.
        </AppText>
      ) : null}
      <AppText variant="caption" color="rgba(255,255,255,0.5)" align="center" style={{ marginTop: theme.spacing.md }}>
        The structured result will always be editable before saving — nothing is stored automatically.
      </AppText>
    </TabHeroLayout>
  );
};

export const AiVoiceEntryScreen: React.FC = () => <AiTextVoiceEntryScreen mode="voice" />;
export const AiTextEntryScreen: React.FC = () => <AiTextVoiceEntryScreen mode="text" />;
