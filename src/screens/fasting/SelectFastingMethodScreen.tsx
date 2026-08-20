import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppButton } from '@/components/common/AppButton';
import { AppInput } from '@/components/common/AppInput';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { FASTING_METHODS, FastingMethodId } from '@/features/fasting/models';
import { MethodCard } from '@/features/fasting/components/MethodCard';
import { SafetyNotice } from '@/features/fasting/components/SafetyNotice';
import { startFastThunk } from '@/features/fasting/fastingSlice';
import { selectFastingActionStatus } from '@/features/fasting/selectors';

const CATEGORY_SEGMENTS = [
  { key: 'intermittent', label: 'Intermittent' },
  { key: 'longer', label: 'Longer' },
  { key: 'individual', label: 'Individual' },
];

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
    <>
      <AppHeader title="Choose a method" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl segments={CATEGORY_SEGMENTS} selectedKey={category} onChange={changeCategory} />
        </View>

        {category === 'longer' ? <View style={{ marginBottom: theme.spacing.sm }}><SafetyNotice /></View> : null}

        {category === 'individual' ? (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <AppInput label="Fasting duration (hours)" value={customHours} onChangeText={setCustomHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
            <MethodCard method={FASTING_METHODS.find((m) => m.id === 'individual')!} selected={selectedMethod === 'individual'} onPress={() => selectMethod('individual')} />
          </View>
        ) : (
          methods.map((method) => (
            <MethodCard key={method.id} method={method} selected={selectedMethod === method.id} onPress={() => selectMethod(method.id)} />
          ))
        )}

        {selectedDefinition ? (
          <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.md }}>
            <AppText variant="bodySmall" color={theme.colors.textSecondary} align="center" style={{ marginBottom: theme.spacing.sm }}>
              {selectedDefinition.name === 'Individual fasting' ? `${customHours || 16}-hour fast selected.` : `${selectedDefinition.name} selected.`} Ready when you are.
            </AppText>
            <AppButton label="Start this fast" onPress={confirmStart} loading={actionStatus === 'loading'} />
          </View>
        ) : null}

        <AppButton
          label="Set up a recurring plan instead"
          variant="ghost"
          onPress={() => navigation.navigate('CreateFastingPlan')}
          style={{ marginTop: theme.spacing.sm }}
        />
      </AppScreen>
    </>
  );
};
