import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch } from '@/store/hooks';
import { updateProfile } from '@/features/profile/profileSlice';
import { AuthHeroLayout } from './AuthHeroLayout';

/**
 * The last account-creation field — needed specifically for the HealthyMe
 * webshop, not for the app's own core function, but still required before
 * `Main` becomes reachable (see RootNavigator: `Main` needs both
 * `isAuthenticated` and a non-empty `profile.address`). Reached
 * automatically right after a successful registration — AuthNavigator
 * opens straight here instead of `Login` once authenticated with no
 * address on file, and completing it here (rather than requiring an
 * explicit `navigation.navigate` call from RegisterScreen) is what makes
 * that reachable at all: `registerThunk` sets `session` synchronously, and
 * RootNavigator's very next render would otherwise swap straight past any
 * queued navigation call once `isAuthenticated` alone gated the switch.
 */
export const AddressStepScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [address, setAddress] = useState('');

  const finish = useCallback(() => {
    dispatch(updateProfile({ address: address.trim() }));
  }, [dispatch, address]);

  return (
    <AuthHeroLayout>
      <View style={{ marginBottom: theme.spacing.lg }}>
        <AppText variant="displayMedium" color="#FFFFFF">
          {t('auth.address.title')}
        </AppText>
        <AppText variant="bodyMedium" color="rgba(255,255,255,0.7)" style={{ marginTop: theme.spacing.xs }}>
          {t('auth.address.subtitle')}
        </AppText>
      </View>

      <FadeSlideIn>
        <HeroTextField
          label={t('auth.address.label')}
          value={address}
          onChangeText={setAddress}
          multiline
          // HeroTextField's base style hardcodes a single-line `height` —
          // `height` (not `minHeight`) here is what actually overrides it,
          // since both set the same style property and this one is later
          // in the merge order; `textAlignVertical`/`paddingTop` keep
          // multiline text starting at the top instead of vertically
          // centered against that taller box.
          style={{ height: 88, textAlignVertical: 'top', paddingTop: 12, marginBottom: theme.spacing.lg }}
        />
        <AppGradientButton label={t('auth.address.submit')} onPress={finish} disabled={!address.trim()} />
      </FadeSlideIn>
    </AuthHeroLayout>
  );
};
