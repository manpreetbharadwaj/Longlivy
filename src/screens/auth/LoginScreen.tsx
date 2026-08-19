import React, { useState, useCallback } from 'react';
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
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginThunk } from '@/features/auth/authSlice';
import { selectAuthError, selectAuthStatus } from '@/features/auth/selectors';
import { DEMO_USER } from '@/mock/demoUser';
import { AuthHeroLayout } from './AuthHeroLayout';

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
    <AuthHeroLayout>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.xl, marginBottom: theme.spacing.xl }}>
        <View style={{ width: 56, height: 56, borderRadius: 18, overflow: 'hidden', marginBottom: theme.spacing.md }}>
          <LinearGradient colors={['#1FA391', '#0B4F4A']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="headingLarge" color="#FFFFFF" weight="800">
              L
            </AppText>
          </LinearGradient>
        </View>
        <AppText variant="displayMedium" color="#FFFFFF" align="center">
          Welcome back
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" align="center" style={{ marginTop: theme.spacing.xxs }}>
          Log in to continue your Longlivy routine.
        </AppText>
      </View>

      <FadeSlideIn>
        <HeroTextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={{ marginBottom: theme.spacing.sm }} />
        <HeroTextField label="Password" value={password} onChangeText={setPassword} isPassword style={{ marginBottom: theme.spacing.xxs }} />

        {error ? (
          <AppText variant="bodySmall" color="#E06A5D" style={{ marginTop: theme.spacing.xs }}>
            {error}
          </AppText>
        ) : null}

        <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8} style={{ alignSelf: 'flex-end', marginTop: theme.spacing.xs, marginBottom: theme.spacing.md }}>
          <AppText variant="label" color="rgba(255,255,255,0.7)">
            Forgot password?
          </AppText>
        </Pressable>

        <AppGradientButton label="Log in" onPress={handleLogin} loading={status === 'loading'} />

        <View style={{ marginTop: theme.spacing.md, flexDirection: 'row', justifyContent: 'center' }}>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)">
            New to Longlivy?{' '}
          </AppText>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={8}>
            <AppText variant="bodyMedium" color="#5FBFAE">
              Create an account
            </AppText>
          </Pressable>
        </View>

        <AppText variant="caption" color="rgba(255,255,255,0.4)" align="center" style={{ marginTop: theme.spacing.lg }}>
          Demo credentials are pre-filled. Authentication is mocked locally for this prototype.
        </AppText>
      </FadeSlideIn>
    </AuthHeroLayout>
  );
};
