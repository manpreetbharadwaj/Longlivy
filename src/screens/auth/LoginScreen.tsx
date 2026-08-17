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
import { loginThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { DEMO_USER } from '@/mock/demoUser';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState('demo1234');

  const handleLogin = useCallback(() => {
    dispatch(loginThunk({ email, password }));
  }, [dispatch, email, password]);

  return (
    <AppScreen>
      <View style={{ marginTop: theme.spacing.xxl, marginBottom: theme.spacing.xl }}>
        <AppText variant="displayMedium">Welcome back</AppText>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.xxs }}>
          Log in to continue your Longlivy routine.
        </AppText>
      </View>

      <AppInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.sm }} />
      <AppInput label="Password" value={password} onChangeText={setPassword} secureTextEntry style={{ marginBottom: theme.spacing.xxs }} />

      {error ? (
        <AppText variant="bodySmall" color={theme.colors.danger} style={{ marginBottom: theme.spacing.sm }}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        label="Forgot password?"
        onPress={() => navigation.navigate('ForgotPassword')}
        variant="ghost"
        fullWidth={false}
        style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.md, height: 32 }}
      />

      <AppButton label="Log in" onPress={handleLogin} loading={status === 'loading'} />

      <View style={{ marginTop: theme.spacing.sm, flexDirection: 'row', justifyContent: 'center' }}>
        <AppText variant="bodyMedium" color={theme.colors.textSecondary}>
          New to Longlivy?{' '}
        </AppText>
        <AppText variant="bodyMedium" color={theme.colors.primary} onPress={() => navigation.navigate('Register')}>
          Create an account
        </AppText>
      </View>

      <AppText variant="caption" color={theme.colors.textTertiary} align="center" style={{ marginTop: theme.spacing.lg }}>
        Demo credentials are pre-filled. Authentication is mocked locally for this prototype.
      </AppText>
    </AppScreen>
  );
};
