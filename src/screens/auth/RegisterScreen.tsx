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
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { registerThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { updateProfile } from '@/features/profile/profileSlice';
import { useOnboardingDraft, ageToDateOfBirth } from '@/features/onboarding/OnboardingContext';
import { AuthHeroLayout } from './AuthHeroLayout';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);
  // Onboarding no longer collects name — it's identity/account info, not
  // health personalization, so it's asked here instead, alongside email/password.
  const { draft } = useOnboardingDraft();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
        dateOfBirth: draft.dateOfBirth ?? (draft.age ? ageToDateOfBirth(draft.age) : '1995-01-01'),
        gender: draft.gender ?? 'diverse',
        heightCm: draft.heightCm ?? 175,
        weightKg: draft.weightKg ?? 75,
      })
    );
    // The `profile` slice (read by ProfileScreen etc.) was seeded with a
    // generic placeholder name at the end of onboarding, before an account
    // — and therefore a real name — existed. Sync the real one in now.
    dispatch(updateProfile({ firstName, lastName }));
  }, [dispatch, firstName, lastName, email, password, draft]);

  return (
    <AuthHeroLayout onBack={() => navigation.goBack()}>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <AppText variant="displayMedium" color="#FFFFFF">
          {t('auth.register.title')}
        </AppText>
      </View>

      <FadeSlideIn>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <HeroTextField label={t('auth.register.firstName')} value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={{ flex: 1 }}>
            <HeroTextField label={t('auth.register.lastName')} value={lastName} onChangeText={setLastName} />
          </View>
        </View>
        <HeroTextField label={t('auth.register.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.sm }} />
        <HeroTextField label={t('auth.register.password')} value={password} onChangeText={setPassword} isPassword style={{ marginBottom: theme.spacing.sm }} />
        {error ? (
          <AppText variant="bodySmall" color="#C97268" style={{ marginBottom: theme.spacing.sm }}>
            {error}
          </AppText>
        ) : null}
        <AppGradientButton label={t('auth.register.submit')} onPress={handleRegister} disabled={!valid} loading={status === 'loading'} />
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={{ alignSelf: 'center', marginTop: theme.spacing.md }}>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)">
            {t('auth.register.haveAccount')} <AppText variant="bodyMedium" color="#4FAE8F">{t('auth.register.logIn')}</AppText>
          </AppText>
        </Pressable>
      </FadeSlideIn>
    </AuthHeroLayout>
  );
};
