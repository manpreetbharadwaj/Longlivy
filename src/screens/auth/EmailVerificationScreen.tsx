import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { authRepository } from '@/features/auth/repository';
import { useAppSelector } from '@/store/hooks';
import { selectAuthSession } from '@/features/auth/selectors';

export const EmailVerificationScreen: React.FC = () => {
  const { theme } = useTheme();
  const session = useAppSelector(selectAuthSession);
  const [verified, setVerified] = useState(session?.user.emailVerified ?? false);

  const verify = useCallback(async () => {
    await authRepository.verifyEmail('123456');
    setVerified(true);
  }, []);

  return (
    <AppScreen>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xxl }}>
        <AppIconTile name={verified ? 'checkmark-circle' : 'mail-outline'} shape="circle" color={verified ? theme.colors.success : theme.colors.primary} size={72} iconSize={32} />
      </View>
      <AppText variant="headingLarge" align="center" style={{ marginTop: theme.spacing.md }}>
        {verified ? 'Email verified' : 'Verify your email'}
      </AppText>
      <AppText variant="bodyMedium" color={theme.colors.textSecondary} align="center" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
        {verified
          ? 'Your account is fully set up.'
          : `We sent a verification link to ${session?.user.email ?? 'your email'}.`}
      </AppText>
      {!verified ? <AppButton label="I've verified my email" onPress={verify} fullWidth={false} style={{ alignSelf: 'center' }} /> : null}
    </AppScreen>
  );
};
