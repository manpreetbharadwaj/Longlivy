import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';
import { onboardingData, onboardingGlass } from '../theme/onboardingTheme';

interface RulerPickerProps {
  min: number;
  max: number;
  /** Distance between adjacent ticks. 1 for whole units (age, height), can be fractional. */
  step?: number;
  value: number;
  onChange: (value: number) => void;
  /** How many `step`s apart a "major" (taller, labeled) tick appears. */
  majorEvery?: number;
  unit: string;
  /** Decimal places on the big readout — 0 for age/height/weight-as-integer. */
  decimals?: number;
  accentColor?: string;
}

const TICK_GAP = 14;
const MINOR_HEIGHT = 18;
const MAJOR_HEIGHT = 34;

/**
 * The flagship onboarding interaction — a horizontal drag ruler with a huge
 * live-updating number readout, used for Age, Height and Weight. One
 * component, three configs, rather than three bespoke widgets: the
 * mechanic reads as premium regardless (Whoop/Bear/Fabulous all converge
 * on the same pattern for numeric onboarding fields), so the engineering
 * investment goes into making this one interaction excellent.
 */
export const RulerPicker: React.FC<RulerPickerProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  majorEvery = 5,
  unit,
  decimals = 0,
  accentColor = onboardingData,
}) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [displayValue, setDisplayValue] = useState(value);

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, i) => Number((min + i * step).toFixed(4)));
  }, [min, max, step]);

  const sidePadding = width / 2 - theme.spacing.md;
  const indexOf = useCallback((v: number) => Math.round((v - min) / step), [min, step]);

  useEffect(() => {
    // Position the ruler at the current value on mount only — subsequent
    // value changes come *from* scrolling, so re-syncing here would fight
    // the user's own gesture.
    scrollRef.current?.scrollTo({ x: indexOf(value) * TICK_GAP, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleIndexChange = useCallback(
    (index: number) => {
      const clamped = Math.min(ticks.length - 1, Math.max(0, index));
      const next = ticks[clamped];
      setDisplayValue(next);
      onChange(next);
    },
    [ticks, onChange]
  );

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  useAnimatedReaction(
    () => Math.round(scrollX.value / TICK_GAP),
    (index, previous) => {
      if (index !== previous) runOnJS(handleIndexChange)(index);
    },
    [handleIndexChange]
  );

  return (
    <View>
      <View style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <AppText variant="metricHero" color={onboardingGlass.textPrimary}>
            {displayValue.toFixed(decimals)}
          </AppText>
          <AppText variant="headingMedium" color={onboardingGlass.textSecondary} style={{ marginBottom: 10, marginLeft: 6 }}>
            {unit}
          </AppText>
        </View>
      </View>

      <View style={{ height: MAJOR_HEIGHT + 28 }}>
        {/* Fixed center indicator, drawn above the ruler track. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            marginLeft: -1.5,
            width: 3,
            height: MAJOR_HEIGHT,
            borderRadius: 2,
            backgroundColor: accentColor,
            shadowColor: accentColor,
            shadowOpacity: 0.8,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 0 },
          }}
        />
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TICK_GAP}
          decelerationRate="fast"
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: sidePadding, alignItems: 'flex-end' }}
        >
          {ticks.map((t, i) => {
            const isMajor = i % majorEvery === 0;
            return (
              <View key={t} style={{ width: TICK_GAP, alignItems: 'center' }}>
                <View
                  style={{
                    width: isMajor ? 2 : 1,
                    height: isMajor ? MAJOR_HEIGHT : MINOR_HEIGHT,
                    borderRadius: 1,
                    backgroundColor: isMajor ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)',
                  }}
                />
              </View>
            );
          })}
        </Animated.ScrollView>
      </View>
    </View>
  );
};
