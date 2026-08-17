import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile } from '@/features/calories/calorieSlice';

export const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));

  const save = useCallback(() => {
    dispatch(updateProfile({ firstName, lastName, heightCm: Number(heightCm), weightKg: Number(weightKg) }));
    dispatch(setBodyProfile({ heightCm: Number(heightCm), weightKg: Number(weightKg) }));
    navigation.goBack();
  }, [dispatch, firstName, lastName, heightCm, weightKg, navigation]);

  return (
    <>
      <AppHeader title="Edit profile" onBack={() => navigation.goBack()} />
      <AppScreen>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppInput label="First name" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="Last name" value={lastName} onChangeText={setLastName} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <AppInput label="Height (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <AppInput label="Weight (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
          </View>
        </View>
        <AppButton label="Save changes" onPress={save} />
      </AppScreen>
    </>
  );
};
