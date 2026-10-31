import React from 'react';
import { Pressable, View } from 'react-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { MainTabParamList } from '@/navigation/types';
import { useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { useTranslation } from '@/localization';
import { useTheme } from '@/hooks/useTheme';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { AppText } from './AppText';

interface ScreenHeaderProps {
  title: string;
}

/**
 * Shared header for titled top-level screens. SectionHeroLayout already owns
 * the SafeAreaView, so this component only lays out its content within the
 * safe area supplied by the screen shell.
 */
export const ScreenHeader: React.FC<ScreenHeaderProps> = React.memo(({ title }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const profile = useAppSelector(selectUserProfile);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
        {title}
      </AppText>
      <Pressable
        onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })}
        accessibilityRole="button"
        accessibilityLabel={t('profile.title')}
        hitSlop={8}
        style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
      >
        <UserAvatar size={40} avatarId={profile.avatarId} name={profile.firstName} />
      </Pressable>
    </View>
  );
});

ScreenHeader.displayName = 'ScreenHeader';
