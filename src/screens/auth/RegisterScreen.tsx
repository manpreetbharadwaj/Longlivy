import React, { useState, useCallback } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { useOnboardingDraft } from '@/features/onboarding/OnboardingContext';
import { AuthHeroLayout } from './AuthHeroLayout';

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
    <AuthHeroLayout onBack={() => navigation.goBack()}>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <AppText variant="displayMedium" color="#FFFFFF">
          Create your account
        </AppText>
      </View>

      <FadeSlideIn>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <HeroTextField label="First name" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={{ flex: 1 }}>
            <HeroTextField label="Last name" value={lastName} onChangeText={setLastName} />
          </View>
        </View>
        <HeroTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.sm }} />
        <HeroTextField label="Password" value={password} onChangeText={setPassword} isPassword style={{ marginBottom: theme.spacing.sm }} />
        {error ? (
          <AppText variant="bodySmall" color="#E06A5D" style={{ marginBottom: theme.spacing.sm }}>
            {error}
          </AppText>
        ) : null}
        <AppGradientButton label="Create account" onPress={handleRegister} disabled={!valid} loading={status === 'loading'} />
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={{ alignSelf: 'center', marginTop: theme.spacing.md }}>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)">
            Already have an account? <AppText variant="bodyMedium" color="#5FBFAE">Log in</AppText>
          </AppText>
        </Pressable>
      </FadeSlideIn>
    </AuthHeroLayout>
  );
};
