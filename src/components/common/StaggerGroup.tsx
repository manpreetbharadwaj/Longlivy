import React from 'react';
import { ViewStyle } from 'react-native';
import { FadeSlideIn } from './FadeSlideIn';
import { motion } from '@/theme/motion';

interface StaggerGroupProps {
  children: React.ReactNode;
  /** Delay step between successive children, in ms. Defaults to the shared `motion.staggerStepMs` token. */
  step?: number;
  /** Delay before the first child starts, in ms. */
  initialDelay?: number;
  /** Caps how many steps of delay accumulate — keeps long lists (10+ cards) from making the last item feel laggy. */
  maxSteps?: number;
  fromY?: number;
  disabled?: boolean;
  itemStyle?: ViewStyle;
}

/**
 * Wraps each child in `FadeSlideIn` with a computed per-child delay, so
 * screens get a staggered mount-in entrance without hand-rolling
 * `index * motion.staggerStepMs` at every call site. `disabled` renders
 * children directly (e.g. for reduced-motion).
 */
export const StaggerGroup: React.FC<StaggerGroupProps> = ({
  children,
  step = motion.staggerStepMs,
  initialDelay = 0,
  maxSteps = 8,
  fromY,
  disabled = false,
  itemStyle,
}) => {
  const items = React.Children.toArray(children);

  if (disabled) return <>{items}</>;

  return (
    <>
      {items.map((child, index) => {
        const childKey = React.isValidElement(child) ? child.key : null;
        return (
          <FadeSlideIn key={childKey ?? `stagger-${index}`} delay={initialDelay + Math.min(index, maxSteps) * step} fromY={fromY} style={itemStyle}>
            {child}
          </FadeSlideIn>
        );
      })}
    </>
  );
};
