import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { energySourceColors } from '@/theme/gradients';
import { EnergySourceMix } from '../services/FastingCalculator';

interface SourceBarProps {
  weight: number;
  color: string;
  isFirst: boolean;
  isLast: boolean;
}

const SourceBar: React.FC<SourceBarProps> = ({ weight, color, isFirst, isLast }) => {
  const { theme } = useTheme();
  const flexValue = useSharedValue(weight);

  useEffect(() => {
    flexValue.value = withTiming(Math.max(weight, 0.001), { duration: motion.duration.slow, easing: motion.easing.standard });
  }, [weight, flexValue]);

  const style = useAnimatedStyle(() => ({ flex: flexValue.value }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: color,
          // Same small flat radius as AppProgressBar — only at the bar's
          // true outer ends, square where segments meet each other.
          borderTopLeftRadius: isFirst ? theme.radius.flat : 0,
          borderBottomLeftRadius: isFirst ? theme.radius.flat : 0,
          borderTopRightRadius: isLast ? theme.radius.flat : 0,
          borderBottomRightRadius: isLast ? theme.radius.flat : 0,
        },
        style,
      ]}
    />
  );
};

const LEGEND: { key: keyof EnergySourceMix; label: string }[] = [
  { key: 'lastMeal', label: 'Last meal' },
  { key: 'glycogen', label: 'Glycogen' },
  { key: 'fat', label: 'Fat' },
  { key: 'ketones', label: 'Ketones' },
];

interface EnergySourceVisualizationProps {
  mix: EnergySourceMix;
}

/**
 * The "central animated biological visualization" from the design brief —
 * a simplified, smoothly-shifting illustration of which energy source is
 * currently most relevant, not a live physiological measurement. Renders
 * as an animated stacked bar rather than a step-function chart specifically
 * so the visual language itself communicates gradual, continuous change
 * (matches the "avoid implying a process starts at an exact hour"
 * requirement) instead of implying a precise on/off switch.
 */
export const EnergySourceVisualization: React.FC<EnergySourceVisualizationProps> = React.memo(({ mix }) => {
  const { theme } = useTheme();

  return (
    <View>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xxs }}>
        Where your energy is likely coming from
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginBottom: theme.spacing.sm }}>
        A simplified illustration, not a live measurement — real metabolic shifts are gradual and vary between people.
      </AppText>

      <View style={{ flexDirection: 'row', height: 20, borderRadius: theme.radius.flat, overflow: 'hidden' }}>
        <SourceBar weight={mix.lastMeal} color={energySourceColors.lastMeal} isFirst isLast={false} />
        <SourceBar weight={mix.glycogen} color={energySourceColors.glycogen} isFirst={false} isLast={false} />
        <SourceBar weight={mix.fat} color={energySourceColors.fat} isFirst={false} isLast={false} />
        <SourceBar weight={mix.ketones} color={energySourceColors.ketones} isFirst={false} isLast />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
        {LEGEND.map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: theme.spacing.md, marginBottom: theme.spacing.xxs }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: energySourceColors[item.key], marginRight: 5 }} />
            <AppText variant="caption" color="rgba(255,255,255,0.65)">
              {item.label} · {Math.round(mix[item.key] * 100)}%
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
});

EnergySourceVisualization.displayName = 'EnergySourceVisualization';
