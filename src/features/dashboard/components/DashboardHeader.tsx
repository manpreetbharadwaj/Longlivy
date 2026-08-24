import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { HomeStackParamList } from '@/navigation/types';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppSelector } from '@/store/hooks';
import { motion } from '@/theme/motion';
import { selectUserProfile } from '@/features/profile/selectors';
import { selectUnreadNotificationCount } from '@/features/notifications/selectors';
import { dashboardColors } from '../dashboardTheme';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const DashboardHeader: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const profile = useAppSelector(selectUserProfile);
  const unread = useAppSelector(selectUnreadNotificationCount);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md }}>
      <View>
        <AppText variant="bodyMedium" color={dashboardColors.textSecondary}>
          {greeting()}
        </AppText>
        <AppText variant="headingLarge" weight="700" color={dashboardColors.textPrimary}>
          {profile.firstName}
        </AppText>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <PressScale onPress={() => navigation.navigate('Notifications')} accessibilityLabel="Notifications" style={{ marginRight: theme.spacing.sm }}>
          <View>
            <AppIcon name="notifications-outline" size={22} color={dashboardColors.textPrimary} />
            {unread > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -4,
                  backgroundColor: dashboardColors.accent,
                  borderRadius: 8,
                  minWidth: 16,
                  height: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <AppText variant="caption" color={dashboardColors.background} weight="700">
                  {unread}
                </AppText>
              </View>
            ) : null}
          </View>
        </PressScale>
        <PressScale onPress={() => navigation.navigate('Profile')} accessibilityLabel="Profile">
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: dashboardColors.surfaceElevated,
              borderWidth: 1.5,
              borderColor: dashboardColors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText variant="headingSmall" color={dashboardColors.accent}>
              {profile.firstName.charAt(0)}
            </AppText>
          </View>
        </PressScale>
      </View>
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
