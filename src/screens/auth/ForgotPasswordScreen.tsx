import React, { useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppHeader } from '@/components/common/AppHeader';
import { AppText } from '@/components/common/AppText';
import { AppInput } from '@/components/common/AppInput';
import { AppButton } from '@/components/common/AppButton';
import { useTheme } from '@/hooks/useTheme';
import { authRepository } from '@/features/auth/repository';

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
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
    <>
      <AppHeader title="Reset password" onBack={() => navigation.goBack()} />
      <AppScreen>
        {sent ? (
          <AppText variant="bodyLarge" align="center" style={{ marginTop: theme.spacing.xl }}>
            If an account exists for {email}, a reset link has been sent.
          </AppText>
        ) : (
          <>
            <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.md }}>
              Enter the email associated with your account and we'll send reset instructions.
            </AppText>
            <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.md }} />
            <AppButton label="Send reset link" onPress={submit} loading={loading} disabled={!email.includes('@')} />
          </>
        )}
      </AppScreen>
    </>
  );
};
