import React, { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logWeightThunk } from '@/features/weight/weightSlice';
import { selectCurrentWeight } from '@/features/weight/selectors';
import { setBodyProfile } from '@/features/calories/calorieSlice';

export const EnterWeightScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectCurrentWeight);
  const [weight, setWeight] = useState(current ? String(current.weightKg) : '');
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    const kg = Number(weight);
    if (!kg) return;
    setSaving(true);
    await dispatch(logWeightThunk(kg));
    dispatch(setBodyProfile({ weightKg: kg }));
    setSaving(false);
    navigation.goBack();
  }, [weight, dispatch, navigation]);

  return (
    <TabHeroLayout title="Enter weight" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        Manually entered weight is marked separately from values imported from a connected health platform.
      </AppText>
      <HeroTextField label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" style={{ marginBottom: theme.spacing.md }} />
      <AppGradientButton label="Save weight" onPress={save} disabled={!weight} loading={saving} />
    </TabHeroLayout>
  );
};
