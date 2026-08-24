import React, { useEffect } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { HomeStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { AppText } from '@/components/common/AppText';
import { AppIcon, AppIconName } from '@/components/common/AppIcon';
import { GlowOrb } from '@/components/common/GlowOrb';
import { FadeSlideIn } from '@/components/common/FadeSlideIn';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectUserProfile } from '@/features/profile/selectors';
import { logoutThunk } from '@/features/auth/authSlice';
import { dashboardColors, dashboardCardStyle } from '@/features/dashboard/dashboardTheme';

export const ProfileScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectUserProfile);

  const handleLogout = () => dispatch(logoutThunk());

  return (
    <TabHeroLayout>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: dashboardColors.surfaceElevated,
            borderWidth: 1,
            borderColor: dashboardColors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="chevron-back" size={18} color={dashboardColors.textPrimary} />
        </Pressable>
        <AppText variant="headingMedium" weight="600" color={dashboardColors.textPrimary} align="center" style={{ flex: 1 }}>
          Profile
        </AppText>
        <View style={{ width: 36 }} />
      </View>

      <ProfileAvatar initial={profile.firstName.charAt(0)} />

      <AppText variant="displayMedium" color={dashboardColors.textPrimary} align="center" style={{ marginTop: theme.spacing.md }}>
        {profile.firstName} {profile.lastName}
      </AppText>
      <AppText variant="bodyLarge" color={dashboardColors.textSecondary} align="center" style={{ marginTop: 2 }}>
        {profile.email}
      </AppText>

      <View style={[dashboardCardStyle, { marginTop: theme.spacing.xl, padding: theme.spacing.sm }]}>
        <StatRow index={0} icon="resize-outline" label="Height" value={`${profile.heightCm} cm`} />
        <StatRow index={1} icon="scale-outline" label="Weight" value={`${profile.weightKg} kg`} />
        <StatRow index={2} icon="walk-outline" label="Activity level" value={profile.activityLevel.replace('_', ' ')} capitalize />
        <StatRow index={3} icon="flag-outline" label="Goal" value={profile.goal.replace('_', ' ')} capitalize isLast />
      </View>

      <View style={{ marginTop: theme.spacing.lg }}>
        <ActionRow index={0} icon="person-outline" label="Edit profile" onPress={() => navigation.navigate('EditProfile')} />
        <ActionRow index={1} icon="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        <ActionRow index={2} icon="heart-outline" label="Health integrations" onPress={() => navigation.navigate('HealthIntegrations')} />
        <ActionRow index={3} icon="shield-checkmark-outline" label="Privacy" onPress={() => navigation.navigate('Privacy')} isLast />
      </View>

      <Pressable
        onPress={handleLogout}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          height: 52,
          borderRadius: 16,
          marginTop: theme.spacing.xl,
          backgroundColor: dashboardColors.surface,
          borderWidth: 1.5,
          borderColor: dashboardColors.accent,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <AppIcon name="log-out-outline" size={18} color={dashboardColors.accent} />
        <AppText variant="headingSmall" color={dashboardColors.accent} style={{ marginLeft: 8 }}>
          Log out
        </AppText>
      </Pressable>
    </TabHeroLayout>
  );
};

/** Premium avatar hero — dark surface, cyan ring, a soft glow behind it, and a couple of tiny orbiting accent dots for polish. No green, no purple. */
const ProfileAvatar: React.FC<{ initial: string }> = React.memo(({ initial }) => {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withDelay(
      200,
      withRepeat(withSequence(withTiming(1, { duration: motion.duration.ambient, easing: motion.easing.standard }), withTiming(0, { duration: motion.duration.ambient, easing: motion.easing.standard })), -1, true)
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.7 + glow.value * 0.3 }));

  const size = 108;
  const frame = size + 24; // fixed-size square the glow/ring/dots all center within
  const glowSize = frame * 1.7;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: frame, height: frame, alignItems: 'center', justifyContent: 'center' }}>
        <GlowOrb size={glowSize} color={dashboardColors.accent} opacity={0.2} pulse style={{ top: (frame - glowSize) / 2, left: (frame - glowSize) / 2 }} />
        <Svg width={frame} height={frame} style={{ position: 'absolute' }}>
          <Circle cx={frame / 2} cy={frame / 2} r={frame / 2 - 2} stroke={dashboardColors.border} strokeWidth={1} fill="none" />
        </Svg>
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: dashboardColors.surfaceElevated,
              borderWidth: 2,
              borderColor: dashboardColors.accent,
              alignItems: 'center',
              justifyContent: 'center',
            },
            glowStyle,
          ]}
        >
          <AppText variant="displayLarge" color={dashboardColors.accent} weight="700">
            {initial}
          </AppText>
        </Animated.View>
        <View style={{ position: 'absolute', top: 4, right: 8, width: 5, height: 5, borderRadius: 3, backgroundColor: dashboardColors.accentBright }} />
        <View style={{ position: 'absolute', bottom: 10, left: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: dashboardColors.accentBright, opacity: 0.7 }} />
      </View>
    </View>
  );
});
ProfileAvatar.displayName = 'ProfileAvatar';

const StatRow: React.FC<{ index: number; icon: AppIconName; label: string; value: string; capitalize?: boolean; isLast?: boolean }> = React.memo(({ index, icon, label, value, capitalize, isLast }) => {
  const { theme } = useTheme();
  return (
    <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: theme.spacing.xs,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: dashboardColors.border,
        }}
      >
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            backgroundColor: dashboardColors.surfaceSecondary,
            borderWidth: 1,
            borderColor: dashboardColors.border,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: theme.spacing.sm,
          }}
        >
          <AppIcon name={icon} size={16} color={dashboardColors.accent} />
        </View>
        <AppText variant="bodyLarge" color={dashboardColors.textSecondary} style={{ flex: 1 }}>
          {label}
        </AppText>
        <AppText variant="bodyLarge" weight="600" color={dashboardColors.accent} style={capitalize ? { textTransform: 'capitalize' } : undefined}>
          {value}
        </AppText>
      </View>
    </FadeSlideIn>
  );
});
StatRow.displayName = 'StatRow';

const ActionRow: React.FC<{ index: number; icon: AppIconName; label: string; onPress: () => void; isLast?: boolean }> = React.memo(
  ({ index, icon, label, onPress, isLast }) => {
    const { theme } = useTheme();
    return (
      <FadeSlideIn delay={index * motion.staggerStepMs} fromY={6}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={({ pressed }) => [
            dashboardCardStyle,
            {
              flexDirection: 'row',
              alignItems: 'center',
              padding: theme.spacing.sm,
              marginBottom: isLast ? 0 : theme.spacing.sm,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              backgroundColor: dashboardColors.surfaceSecondary,
              borderWidth: 1,
              borderColor: dashboardColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: theme.spacing.sm,
            }}
          >
            <AppIcon name={icon} size={18} color={dashboardColors.accent} />
          </View>
          <AppText variant="bodyLarge" weight="600" color={dashboardColors.textPrimary} style={{ flex: 1 }}>
            {label}
          </AppText>
          <AppIcon name="chevron-forward" size={18} color={dashboardColors.textMuted} />
        </Pressable>
      </FadeSlideIn>
    );
  }
);
ActionRow.displayName = 'ActionRow';
