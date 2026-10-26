import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppIconTile } from '@/components/common/AppIconTile';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { authRepository } from '@/features/auth/repository';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { markEmailVerified } from '@/features/auth/authSlice';
import { selectAuthSession } from '@/features/auth/selectors';

export const EmailVerificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const session = useAppSelector(selectAuthSession);
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const [verified, setVerified] = useState(session?.user.emailVerified ?? false);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [resent, setResent] = useState(false);

  // The emailed code is checked by POST /auth/email/verify (422 when wrong or expired).
  const verify = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      await authRepository.verifyEmail(code.trim());
      setVerified(true);
      dispatch(markEmailVerified());
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('auth.emailVerification.failed'));
    } finally {
      setBusy(false);
    }
  }, [code, t, dispatch]);

  const resend = useCallback(async () => {
    setBusy(true);
    setError(undefined);
    try {
      await authRepository.resendVerificationEmail();
      setResent(true);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t('auth.emailVerification.failed'));
    } finally {
      setBusy(false);
    }
  }, [t]);

  return (
    <TabHeroLayout title={t('auth.emailVerification.title')} onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xl }}>
        <AppIconTile name={verified ? 'checkmark-circle' : 'mail-outline'} shape="circle" color={verified ? theme.colors.success : theme.colors.primary} size={72} iconSize={32} />
      </View>
      <AppText variant="headingLarge" color="#FFFFFF" align="center" style={{ marginTop: theme.spacing.md }}>
        {verified ? t('auth.emailVerification.verifiedTitle') : t('auth.emailVerification.title')}
      </AppText>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" align="center" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        {verified
          ? t('auth.emailVerification.verifiedBody')
          : t('auth.emailVerification.sentTo', { email: session?.user.email ?? t('auth.emailVerification.yourEmail') })}
      </AppText>
      {!verified ? (
        <View>
          <HeroTextField
            label={t('auth.emailVerification.code')}
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ marginBottom: theme.spacing.sm }}
          />
          {error ? (
            <AppText variant="bodySmall" color="#C97268" style={{ marginBottom: theme.spacing.sm }}>
              {error}
            </AppText>
          ) : null}
          <AppGradientButton label={t('auth.emailVerification.verifiedButton')} onPress={verify} loading={busy} disabled={!code.trim()} style={{ marginTop: theme.spacing.xs }} />
          <Pressable onPress={resend} disabled={busy || resent} hitSlop={8} style={{ alignSelf: 'center', marginTop: theme.spacing.md, opacity: busy || resent ? 0.5 : 1 }}>
            <AppText variant="label" color="rgba(255,255,255,0.75)">
              {resent ? t('auth.emailVerification.resent') : t('auth.emailVerification.resend')}
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </TabHeroLayout>
  );
};
