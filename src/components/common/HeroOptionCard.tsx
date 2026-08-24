import React, { useEffect } from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, interpolateColor } from 'react-native-reanimated';
import { AppText } from './AppText';
import { AppIcon, AppIconName } from './AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';

interface HeroOptionCardProps {
  icon?: AppIconName;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** 'row': icon left, text right (list-style options). 'column': icon above centered text (2-up choice screens). */
  layout?: 'row' | 'column';
  /** Border/fill tint when selected — defaults to the brand teal used across the hero screens. */
  accentColor?: string;
  style?: ViewStyle;
}

const UNSELECTED_BORDER = 'rgba(255,255,255,0.14)';
const UNSELECTED_BG = 'rgba(255,255,255,0.07)';

/**
 * The selectable-option building block for the dark "hero" onboarding
 * screens — the glass-card equivalent of AppCard, but for screens rendered
 * inside OnboardingStepLayout (e.g. ActivityLevelStepScreen). AppCard
 * itself is untouched; this is a parallel component for the dark surface,
 * not a replacement.
 */
export const HeroOptionCard: React.FC<HeroOptionCardProps> = React.memo(
  ({ icon, title, description, selected, onPress, layout = 'row', accentColor = '#1BA7D1', style }) => {
    const { theme } = useTheme();
    const progress = useSharedValue(selected ? 1 : 0);
    const pulse = useSharedValue(1);

    useEffect(() => {
      progress.value = withTiming(selected ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.standard });
      if (selected) {
        pulse.value = withSequence(withTiming(1.03, { duration: 140, easing: motion.easing.decelerate }), withTiming(1, { duration: 180, easing: motion.easing.standard }));
      }
    }, [selected, progress, pulse]);

    const animatedStyle = useAnimatedStyle(() => ({
      borderColor: interpolateColor(progress.value, [0, 1], [UNSELECTED_BORDER, accentColor]),
      backgroundColor: interpolateColor(progress.value, [0, 1], [UNSELECTED_BG, `${accentColor}29`]),
      transform: [{ scale: pulse.value }],
    }));

    return (
      // `style` (e.g. flex: 1 for side-by-side column cards) is applied here,
      // on the Pressable — it's the actual flex participant in the caller's
      // row/list layout. Applying it only to the inner Animated.View left the
      // Pressable unconstrained, collapsing its box and clipping the content.
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} style={style}>
        {({ pressed }) => (
          <Animated.View
            style={[
              {
                borderRadius: theme.radius.lg,
                borderWidth: 1.5,
                padding: theme.spacing.md,
                flexDirection: layout === 'row' ? 'row' : 'column',
                alignItems: 'center',
                alignSelf: 'stretch',
                opacity: pressed ? 0.85 : 1,
              },
              animatedStyle,
            ]}
          >
            {icon ? (
              <View
                style={{
                  width: layout === 'row' ? 44 : 56,
                  height: layout === 'row' ? 44 : 56,
                  borderRadius: theme.radius.md,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: layout === 'row' ? theme.spacing.sm : 0,
                  marginBottom: layout === 'column' ? theme.spacing.xs : 0,
                }}
              >
                <AppIcon name={icon} size={layout === 'row' ? 22 : 26} color="#FFFFFF" />
              </View>
            ) : null}
            <View style={{ flex: layout === 'row' ? 1 : undefined, alignItems: layout === 'column' ? 'center' : undefined }}>
              <AppText variant="headingSmall" color="#FFFFFF" align={layout === 'column' ? 'center' : undefined}>
                {title}
              </AppText>
              {description ? (
                <AppText variant="bodySmall" color="rgba(255,255,255,0.65)" align={layout === 'column' ? 'center' : undefined} style={{ marginTop: 2 }}>
                  {description}
                </AppText>
              ) : null}
            </View>
          </Animated.View>
        )}
      </Pressable>
    );
  }
);

HeroOptionCard.displayName = 'HeroOptionCard';
