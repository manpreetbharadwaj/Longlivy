import React, { useCallback, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { updateProfile } from '@/features/profile/profileSlice';
import { setBodyProfile } from '@/features/calories/calorieSlice';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { AvatarPickerModal } from '@/features/profile/components/AvatarPickerModal';
import { getAvatarPreset } from '@/features/profile/avatars';
import type { DemoUserProfile } from '@/mock/demoUser';

export const EditProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [heightCm, setHeightCm] = useState(String(profile.heightCm));
  const [weightKg, setWeightKg] = useState(String(profile.weightKg));
  const [avatarId, setAvatarId] = useState<string | undefined>(profile.avatarId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const save = useCallback(() => {
    const payload: Partial<DemoUserProfile> = {
      firstName,
      lastName,
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
    };
    if (avatarId) payload.avatarId = avatarId;
    dispatch(updateProfile(payload));
    dispatch(setBodyProfile({ heightCm: Number(heightCm), weightKg: Number(weightKg) }));
    navigation.goBack();
  }, [dispatch, firstName, lastName, heightCm, weightKg, avatarId, navigation]);

  const avatarLabel = getAvatarPreset(avatarId)?.label ?? t('editProfile.initial');

  return (
    <TabHeroLayout title={t('editProfile.title')} onBack={() => navigation.goBack()}>
      <Pressable
        onPress={() => setPickerOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('editProfile.changePhoto')}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.sm,
          paddingVertical: theme.spacing.sm,
          marginBottom: theme.spacing.xs,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <UserAvatar size={64} avatarId={avatarId} name={firstName} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" color="rgba(255,255,255,0.65)">
            {t('editProfile.profilePicture')}
          </AppText>
          <AppText variant="bodyLarge" color="#FFFFFF">
            {avatarLabel}
          </AppText>
        </View>
        <AppIcon name="chevron-forward" size={20} color="rgba(255,255,255,0.55)" />
      </Pressable>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <HeroTextField label={t('editProfile.firstName')} value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={{ flex: 1 }}>
          <HeroTextField label={t('editProfile.lastName')} value={lastName} onChangeText={setLastName} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <HeroTextField label={t('editProfile.heightCm')} value={heightCm} onChangeText={setHeightCm} keyboardType="numeric" />
        </View>
        <View style={{ flex: 1 }}>
          <HeroTextField label={t('editProfile.weightKg')} value={weightKg} onChangeText={setWeightKg} keyboardType="numeric" />
        </View>
      </View>
      <AppGradientButton label={t('editProfile.save')} onPress={save} />

      <AvatarPickerModal
        visible={pickerOpen}
        selectedId={avatarId}
        name={firstName}
        onClose={() => setPickerOpen(false)}
        onConfirm={(id) => {
          setAvatarId(id);
          setPickerOpen(false);
        }}
      />
    </TabHeroLayout>
  );
};
