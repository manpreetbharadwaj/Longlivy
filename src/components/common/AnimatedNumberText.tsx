import React from 'react';
import { TextStyle } from 'react-native';
import { AppText } from './AppText';
import { TypographyTokens } from '@/theme';
import { useAnimatedProgress } from '@/hooks/useAnimatedProgress';

interface AnimatedNumberTextProps {
  /** Final numeric value to count up (or down) to. */
  value: number;
  duration?: number;
  /** Delay in ms before the count-up begins — pass `index * motion.staggerStepMs` to sync with a card's entrance animation. */
  startDelay?: number;
  /** Formats the in-flight (already-rounded-by-caller-if-needed) value into display text. Defaults to a plain rounded integer. */
  formatter?: (n: number) => string;
  variant?: keyof TypographyTokens;
  color?: string;
  weight?: TextStyle['fontWeight'];
  align?: TextStyle['textAlign'];
  style?: TextStyle;
}

/**
 * A number that counts up (or down) from 0 to `value` on mount instead of
 * snapping straight to it — used for the dashboard's daily metrics (calories,
 * minutes, streak days, etc.) so the Home screen reads as alive rather than
 * a static readout. Thin wrapper around the existing useAnimatedProgress
 * bridge (already proven on FastingCard's progress ring) rather than a new
 * animation mechanism.
 */
export const AnimatedNumberText: React.FC<AnimatedNumberTextProps> = React.memo(
  ({ value, duration = 900, startDelay = 0, formatter, variant, color, weight, align, style }) => {
    const animated = useAnimatedProgress(value, duration, { delay: startDelay });
    const display = formatter ? formatter(animated) : `${Math.round(animated)}`;
    return (
      <AppText variant={variant} color={color} weight={weight} align={align} style={style}>
        {display}
      </AppText>
    );
  }
);

AnimatedNumberText.displayName = 'AnimatedNumberText';
