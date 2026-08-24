import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroTextField } from '@/components/common/HeroTextField';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { FASTING_METHODS, FastingMethodId } from '@/features/fasting/models';
import { MethodCard } from '@/features/fasting/components/MethodCard';
import { SafetyNotice } from '@/features/fasting/components/SafetyNotice';
import { startFastThunk } from '@/features/fasting/fastingSlice';
import { selectFastingActionStatus } from '@/features/fasting/selectors';
import { FastingHeroLayout } from './FastingHeroLayout';

const CATEGORY_SEGMENTS = [
  { key: 'intermittent', label: 'Intermittent' },
  { key: 'longer', label: 'Longer' },
  { key: 'individual', label: 'Individual' },
];

const FASTING_GRADIENT = ['#1BA7D1', '#0E7A9E'] as const;

export const SelectFastingMethodScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const dispatch = useAppDispatch();
  const [category, setCategory] = useState('intermittent');
  const [customHours, setCustomHours] = useState('16');
  const [selectedMethod, setSelectedMethod] = useState<FastingMethodId | null>(null);
  const actionStatus = useAppSelector(selectFastingActionStatus);

  const methods = useMemo(() => FASTING_METHODS.filter((m) => m.category === category), [category]);

  // Changing category clears the selection — a method chosen while browsing
  // "Longer" shouldn't silently carry over into "Intermittent".
  const changeCategory = useCallback((next: string) => {
    setCategory(next);
    setSelectedMethod(null);
  }, []);

  // Selecting a method only highlights it — starting the fast is a
  // deliberate, separate confirmation (see "Start this fast" below), not an
  // immediate side effect of tapping the card.
  const selectMethod = useCallback((methodId: FastingMethodId) => setSelectedMethod((prev) => (prev === methodId ? null : methodId)), []);

  const confirmStart = useCallback(async () => {
    if (!selectedMethod) return;
    await dispatch(startFastThunk({ method: selectedMethod, customHours: selectedMethod === 'individual' ? Number(customHours) || 16 : undefined }));
    navigation.replace('FastingStarted');
  }, [dispatch, navigation, selectedMethod, customHours]);

  const selectedDefinition = FASTING_METHODS.find((m) => m.id === selectedMethod);

  return (
    <FastingHeroLayout title="Choose a method" onBack={() => navigation.goBack()}>
      <FadeSlideIn delay={0}>
        <View style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl segments={CATEGORY_SEGMENTS} selectedKey={category} onChange={changeCategory} variant="hero" />
        </View>
      </FadeSlideIn>

      {category === 'longer' ? (
        <FadeSlideIn delay={motion.staggerStepMs}>
          <View style={{ marginBottom: theme.spacing.sm }}>
            <SafetyNotice />
          </View>
        </FadeSlideIn>
      ) : null}

      {category === 'individual' ? (
        <FadeSlideIn delay={motion.staggerStepMs}>
          <View style={{ marginBottom: theme.spacing.sm }}>
            <HeroTextField
              label="Fasting duration (hours)"
              value={customHours}
              onChangeText={setCustomHours}
              keyboardType="numeric"
              style={{ marginBottom: theme.spacing.sm }}
            />
            <MethodCard method={FASTING_METHODS.find((m) => m.id === 'individual')!} selected={selectedMethod === 'individual'} onPress={() => selectMethod('individual')} />
          </View>
        </FadeSlideIn>
      ) : (
        methods.map((method, index) => (
          <FadeSlideIn key={method.id} delay={motion.staggerStepMs * (index + 1)} fromY={10}>
            <MethodCard method={method} selected={selectedMethod === method.id} onPress={() => selectMethod(method.id)} />
          </FadeSlideIn>
        ))
      )}

      {selectedDefinition ? (
        <FadeSlideIn delay={0} fromY={12}>
          <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <AppText variant="bodySmall" color="rgba(255,255,255,0.65)" align="center" style={{ marginBottom: theme.spacing.sm }}>
              {selectedDefinition.name === 'Individual fasting' ? `${customHours || 16}-hour fast selected.` : `${selectedDefinition.name} selected.`} Ready when you are.
            </AppText>
            <AppGradientButton label="Start this fast" onPress={confirmStart} loading={actionStatus === 'loading'} colors={FASTING_GRADIENT} />
          </View>
        </FadeSlideIn>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate('CreateFastingPlan')}
        accessibilityRole="button"
        style={({ pressed }) => ({
          height: theme.componentSizes.buttonHeight,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: theme.spacing.sm,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <AppText variant="headingSmall" color="rgba(255,255,255,0.7)">
          Set up a recurring plan instead
        </AppText>
      </Pressable>
    </FastingHeroLayout>
  );
};
