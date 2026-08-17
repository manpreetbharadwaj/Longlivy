import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  const { draft } = useOnboardingDraft();

  // Name was already collected during onboarding — pre-filled, not re-asked from scratch.
  const [firstName, setFirstName] = useState(draft.firstName);
  const [lastName, setLastName] = useState(draft.lastName);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const valid = firstName && lastName && email.includes('@') && password.length >= 6;

  const handleRegister = useCallback(() => {
    dispatch(
      registerThunk({
        firstName,
        lastName,
        email,
        password,
        dateOfBirth: draft.dateOfBirth || '1995-01-01',
        gender: draft.gender ?? 'diverse',
        heightCm: Number(draft.heightCm) || 175,
        weightKg: Number(draft.weightKg) || 75,
      })
    );
  }, [dispatch, firstName, lastName, email, password, draft]);

  return (
    <AppScreen>
      <View style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
        <AppText variant="displayMedium">Create your account</AppText>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppInput label="First name" value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={{ flex: 1 }}>
          <AppInput label="Last name" value={lastName} onChangeText={setLastName} />
        </View>
      </View>
      <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.sm }} />
      <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: theme.spacing.sm }} />
      {error ? (
        <AppText variant="bodySmall" color={theme.colors.danger} style={{ marginBottom: theme.spacing.sm }}>
          {error}
        </AppText>
      ) : null}
      <AppButton label="Create account" onPress={handleRegister} disabled={!valid} loading={status === 'loading'} />
      <AppButton label="Already have an account? Log in" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: theme.spacing.xs }} />
    </AppScreen>
  );
};
