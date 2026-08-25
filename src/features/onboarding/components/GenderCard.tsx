import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { GenderGlyph } from './GenderGlyph';
import { onboardingAccent, onboardingGlass } from '../theme/onboardingTheme';

interface GenderCardProps {
  kind: 'female' | 'male' | 'diverse';
  label: string;
  selected: boolean;
  onPress: () => void;
}

/** Large glass selection card for the Gender step — its own component (not a reuse of HeroOptionCard) since it renders a custom SVG silhouette instead of an Ionicons glyph. */
export const GenderCard: React.FC<GenderCardProps> = React.memo(({ kind, label, selected, onPress }) => {
  const { theme } = useTheme();
  const progress = useSharedValue(selected ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.standard });
    if (selected) {
      scale.value = withSequence(withTiming(1.03, { duration: 140, easing: motion.easing.decelerate }), withTiming(1, { duration: 180, easing: motion.easing.standard }));
    }
  }, [selected, progress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(progress.value, [0, 1], [onboardingGlass.border, onboardingGlass.borderSelected]),
    backgroundColor: interpolateColor(progress.value, [0, 1], [onboardingGlass.fill, onboardingGlass.fillSelected]),
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Animated.View
          style={[
            {
              borderRadius: theme.radius.xl,
              borderWidth: 1.5,
              paddingVertical: theme.spacing.lg,
              paddingHorizontal: theme.spacing.xxs,
              // Fixed height (not content-driven) so this card matches its
              // siblings exactly regardless of label length — "Diverse /
              // Other" wraps to two lines while "Male"/"Female" don't, and
              // without this the three cards in the row would render at
              // visibly different heights. Tall enough for a two-line label
              // at headingSmall's line height; justifyContent centers a
              // shorter, one-line label within the same box instead of
              // leaving it pinned to the top with dead space below.
              minHeight: 160,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.88 : 1,
            },
            animatedStyle,
          ]}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginBottom: theme.spacing.sm,
            }}
          >
            <GenderGlyph kind={kind} size={30} color={selected ? onboardingAccent : '#FFFFFF'} />
          </View>
          <AppText variant="headingSmall" color={onboardingGlass.textPrimary} align="center">
            {label}
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
});

GenderCard.displayName = 'GenderCard';
