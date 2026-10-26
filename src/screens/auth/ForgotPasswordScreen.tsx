import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppText } from '@/components/common/AppText';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { authRepository } from '@/features/auth/repository';
import { AuthHeroLayout } from './AuthHeroLayout';

/** Same rule as registration and the API (`password` min 8). */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Two steps on one screen: request a code by email, then set a new password
 * with that code (POST /auth/forgot-password, POST /auth/reset-password).
 */
export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<void>, next: 'code' | 'done') => {
    setError(null);
    setLoading(true);
    try {
      await action();
      setStep(next);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('auth.forgotPassword.failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const requestCode = useCallback(() => run(() => authRepository.requestPasswordReset(email.trim()), 'code'), [email, run]);
  const resetPassword = useCallback(
    () => run(() => authRepository.confirmPasswordReset({ email: email.trim(), code: code.trim(), password }), 'done'),
    [email, code, password, run],
  );

  const errorText = error ? (
    <AppText variant="bodySmall" color="#C97268" style={{ marginBottom: theme.spacing.sm }}>
      {error}
    </AppText>
  ) : null;

  return (
    <AuthHeroLayout onBack={() => navigation.goBack()}>
      <AppText variant="displayMedium" color="#FFFFFF" style={{ marginBottom: theme.spacing.lg }}>
        {t('auth.forgotPassword.title')}
      </AppText>
      {step === 'email' ? (
        <FadeSlideIn>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.md }}>
            {t('auth.forgotPassword.intro')}
          </AppText>
          <HeroTextField label={t('auth.forgotPassword.email')} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" style={{ marginBottom: theme.spacing.md }} />
          {errorText}
          <AppGradientButton label={t('auth.forgotPassword.submit')} onPress={requestCode} loading={loading} disabled={!email.includes('@')} />
        </FadeSlideIn>
      ) : step === 'code' ? (
        <FadeSlideIn>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.md }}>
            {t('auth.forgotPassword.sent', { email: email.trim() })}
          </AppText>
          <HeroTextField label={t('auth.forgotPassword.code')} value={code} onChangeText={setCode} keyboardType="number-pad" autoCapitalize="none" autoCorrect={false} style={{ marginBottom: theme.spacing.sm }} />
          <HeroTextField label={t('auth.forgotPassword.newPassword')} value={password} onChangeText={setPassword} isPassword style={{ marginBottom: theme.spacing.md }} />
          {errorText}
          <AppGradientButton
            label={t('auth.forgotPassword.resetSubmit')}
            onPress={resetPassword}
            loading={loading}
            disabled={!code.trim() || password.length < MIN_PASSWORD_LENGTH}
          />
        </FadeSlideIn>
      ) : (
        <FadeSlideIn>
          <AppText variant="bodyLarge" color="rgba(255,255,255,0.8)" align="center" style={{ marginTop: theme.spacing.xl, marginBottom: theme.spacing.lg }}>
            {t('auth.forgotPassword.done')}
          </AppText>
          <AppGradientButton label={t('auth.forgotPassword.backToLogin')} onPress={() => navigation.goBack()} />
        </FadeSlideIn>
      )}
    </AuthHeroLayout>
  );
};
