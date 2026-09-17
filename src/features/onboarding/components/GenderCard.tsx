import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolate, interpolateColor } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { GenderGlyph } from './GenderGlyph';
import { onboardingGlass, onboardingGenderColors } from '../theme/onboardingTheme';

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
  const accent = onboardingGenderColors[kind];

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

  // Only the icon well carries the gender's own accent — a subtle tint
  // behind the glyph that deepens slightly on selection, and a small scale
  // bump on the glyph itself. The card surface (borderColor/backgroundColor
  // above) stays on the same neutral selected/unselected treatment every
  // other onboarding card uses, so color identity reads as "this icon
  // belongs to this option" rather than "this card is now blue/pink/purple".
  const iconWellStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [`${accent}14`, `${accent}26`]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Animated.View
          style={[
            {
              borderRadius: theme.radius.lg,
              borderWidth: 1.5,
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.xxs,
              // Fixed height (not content-driven) so this card matches its
              // siblings exactly regardless of label length — "Diverse /
              // Other" wraps to two lines while "Male"/"Female" don't, and
              // without this the three cards in the row would render at
              // visibly different heights. Trimmed down from the original
              // 160 — tall enough for a two-line label at headingSmall's
              // line height plus the smaller icon well, no more — so the
              // gender row leaves more of the viewport to the character
              // visual below it.
              minHeight: 122,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.88 : 1,
            },
            animatedStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: theme.spacing.xs,
              },
              iconWellStyle,
            ]}
          >
            <GenderGlyph kind={kind} size={22} color={selected ? accent : `${accent}99`} />
          </Animated.View>
          <AppText variant="headingSmall" color={onboardingGlass.textPrimary} align="center">
            {label}
          </AppText>
        </Animated.View>
      )}
    </Pressable>
  );
});

GenderCard.displayName = 'GenderCard';
