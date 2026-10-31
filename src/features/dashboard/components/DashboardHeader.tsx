import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { SharedValue, useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation } from 'react-native-reanimated';
import { HomeStackParamList, MainTabParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectUserProfile } from '@/features/profile/selectors';
import { UserAvatar } from '@/features/profile/components/UserAvatar';
import { useTranslation } from '@/localization';
import { TranslationKey } from '@/localization/types';
import { dashboardColors } from '../dashboardTheme';

function greetingKey(): TranslationKey {
  const hour = new Date().getHours();
  if (hour < 12) return 'home.greeting.morning';
  if (hour < 18) return 'home.greeting.afternoon';
  return 'home.greeting.evening';
}

interface DashboardHeaderProps {
  /** Scroll offset in px, driving the greeting's collapse-on-scroll. Omitting it keeps the header static. */
  scrollY?: SharedValue<number>;
}

const COLLAPSE_RANGE = 90;

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(({ scrollY }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigation =
    useNavigation<CompositeNavigationProp<NativeStackNavigationProp<HomeStackParamList>, BottomTabNavigationProp<MainTabParamList>>>();
  const profile = useAppSelector(selectUserProfile);

  const greetingStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] };
    const progress = interpolate(scrollY.value, [0, COLLAPSE_RANGE], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: interpolate(progress, [0, 1], [1, 0]),
      transform: [{ scale: interpolate(progress, [0, 1], [1, 0.86]) }, { translateY: interpolate(progress, [0, 1], [0, -6]) }],
    };
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <Animated.View style={greetingStyle}>
        <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
          {t(greetingKey())}
        </AppText>
        <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
          {profile.firstName}
        </AppText>
      </Animated.View>
      <PressScale onPress={() => navigation.navigate('ProfileTab', { screen: 'Profile' })} accessibilityLabel={t('profile.title')}>
        <UserAvatar size={40} avatarId={profile.avatarId} name={profile.firstName} />
      </PressScale>
    </View>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

/** Small press-scale wrapper shared by the header's two icon buttons — same feel as QuickActions' tiles, kept local since it's a one-off pairing here. */
const PressScale: React.FC<{ onPress: () => void; accessibilityLabel: string; style?: StyleProp<ViewStyle>; children: React.ReactNode }> = React.memo(
  ({ onPress, accessibilityLabel, style, children }) => {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.9, { duration: motion.duration.fast });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.duration.fast });
        }}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        <Animated.View style={animatedStyle}>{children}</Animated.View>
      </Pressable>
    );
  }
);
PressScale.displayName = 'PressScale';
