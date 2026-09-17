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

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    setLoading(true);
    await authRepository.resetPassword(email);
    setLoading(false);
    setSent(true);
  }, [email]);

  return (
    <AuthHeroLayout onBack={() => navigation.goBack()}>
      <AppText variant="displayMedium" color="#FFFFFF" style={{ marginBottom: theme.spacing.lg }}>
        {t('auth.forgotPassword.title')}
      </AppText>
      {sent ? (
        <FadeSlideIn>
          <AppText variant="bodyLarge" color="rgba(255,255,255,0.8)" align="center" style={{ marginTop: theme.spacing.xl }}>
            {t('auth.forgotPassword.sent', { email })}
          </AppText>
        </FadeSlideIn>
      ) : (
        <FadeSlideIn>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" style={{ marginBottom: theme.spacing.md }}>
            {t('auth.forgotPassword.intro')}
          </AppText>
          <HeroTextField label={t('auth.forgotPassword.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.md }} />
          <AppGradientButton label={t('auth.forgotPassword.submit')} onPress={submit} loading={loading} disabled={!email.includes('@')} />
        </FadeSlideIn>
      )}
    </AuthHeroLayout>
  );
};
