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
  const actionStatus = useAppSelector(selectFastingActionStatus);

  const methods = useMemo(() => FASTING_METHODS.filter((m) => m.category === category), [category]);

  const start = useCallback(
    async (methodId: FastingMethodId) => {
      await dispatch(startFastThunk({ method: methodId, customHours: methodId === 'individual' ? Number(customHours) || 16 : undefined }));
      navigation.replace('ActiveFast');
    },
    [dispatch, navigation, customHours]
  );

  return (
    <>
      <AppHeader title="Choose a method" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ marginBottom: theme.spacing.md }}>
          <AppSegmentedControl segments={CATEGORY_SEGMENTS} selectedKey={category} onChange={setCategory} />
        </View>

        {category === 'longer' ? <View style={{ marginBottom: theme.spacing.sm }}><SafetyNotice /></View> : null}

        {category === 'individual' ? (
          <View style={{ marginBottom: theme.spacing.sm }}>
            <AppInput label="Fasting duration (hours)" value={customHours} onChangeText={setCustomHours} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
            <AppButton label="Start individual fast" onPress={() => start('individual')} loading={actionStatus === 'loading'} />
          </View>
        ) : (
          methods.map((method) => (
            <MethodCard key={method.id} method={method} onPress={() => start(method.id)} />
          ))
        )}

        <AppButton
          label="Set up a recurring plan instead"
          variant="ghost"
          onPress={() => navigation.navigate('CreateFastingPlan')}
          style={{ marginTop: theme.spacing.md }}
        />
      </AppScreen>
    </>
  );
};
