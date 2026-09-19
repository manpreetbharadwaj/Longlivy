import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import { loginThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD } from '@/mock/demoUser';
import { AuthHeroLayout } from './AuthHeroLayout';

// Deliberately permissive (not RFC 5322) — this only needs to catch "clearly
// not an email" typos before we bother the mock backend, not fully validate
// the address.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  // Pre-filled with a genuinely fictitious demo credential (DEMO_LOGIN_EMAIL,
  // not any real person's address — see demoUser.ts) so this prototype can
  // be entered in one tap. Deliberately not DEMO_USER.email, which is the
  // actual signed-in developer's real address and must never appear as a
  // form default (see the [[demo-user-had-real-email]] fix this reverses
  // the *shape* of, not the substance — that one removed a real personal
  // email from a pre-filled field; this restores pre-filling with fake data).
  const [email, setEmail] = useState(DEMO_LOGIN_EMAIL);
  const [password, setPassword] = useState(DEMO_LOGIN_PASSWORD);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const changeEmail = useCallback((v: string) => {
    setEmail(v);
    if (emailError) setEmailError(null);
  }, [emailError]);

  const changePassword = useCallback((v: string) => {
    setPassword(v);
    if (passwordError) setPasswordError(null);
  }, [passwordError]);

  const handleLogin = useCallback(() => {
    const trimmedEmail = email.trim();
    let hasError = false;

    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError(t('auth.login.emailInvalid'));
      hasError = true;
    }
    if (!password) {
      setPasswordError(t('auth.login.passwordRequired'));
      hasError = true;
    }
    if (hasError) return;

    dispatch(loginThunk({ email: trimmedEmail, password }));
  }, [dispatch, email, password, t]);

  return (
    <AuthHeroLayout>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: theme.spacing.md }}>
          <LinearGradient colors={['#3D5266', '#3D5266']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="headingLarge" color="#FFFFFF" weight="800">
              L
            </AppText>
          </LinearGradient>
        </View>
        <AppText variant="displayMedium" color="#FFFFFF" align="center">
          {t('auth.login.title')}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" align="center" style={{ marginTop: theme.spacing.xxs }}>
          {t('auth.login.subtitle')}
        </AppText>
      </View>

      <FadeSlideIn>
        <HeroTextField
          label={t('auth.login.email')}
          placeholder={t('auth.login.emailPlaceholder')}
          value={email}
          onChangeText={changeEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={{ marginBottom: emailError ? theme.spacing.xxs : theme.spacing.sm }}
        />
        {emailError ? (
          <AppText variant="bodySmall" color="#C97268" style={{ marginBottom: theme.spacing.sm }}>
            {emailError}
          </AppText>
        ) : null}

        <HeroTextField
          label={t('auth.login.password')}
          placeholder={t('auth.login.passwordPlaceholder')}
          value={password}
          onChangeText={changePassword}
          isPassword
          style={{ marginBottom: passwordError ? theme.spacing.xxs : theme.spacing.xxs }}
        />
        {passwordError ? (
          <AppText variant="bodySmall" color="#C97268" style={{ marginTop: theme.spacing.xxs }}>
            {passwordError}
          </AppText>
        ) : null}

        {error ? (
          <AppText variant="bodySmall" color="#C97268" style={{ marginTop: theme.spacing.xs }}>
            {error}
          </AppText>
        ) : null}

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: theme.spacing.xs, marginBottom: theme.spacing.md }}>
          <AppText variant="label" color="rgba(255,255,255,0.7)">
            {t('auth.login.forgotPassword')}
          </AppText>
        </Pressable>

        <AppGradientButton label={t('auth.login.submit')} onPress={handleLogin} loading={status === 'loading'} />

        <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'center' }}>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)">
            {t('auth.login.newToLonglivy')}{' '}
          </AppText>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <AppText variant="bodyMedium" color="#5C7A94">
              {t('auth.login.createAccount')}
            </AppText>
          </Pressable>
        </View>

        <AppText variant="caption" color="rgba(255,255,255,0.4)" align="center" style={{ marginTop: theme.spacing.lg }}>
          {t('auth.mockNotice')}
        </AppText>
      </FadeSlideIn>
    </AuthHeroLayout>
  );
};
