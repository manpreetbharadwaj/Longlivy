import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { useTheme } from '@/hooks/useTheme';
import { ColorTokens } from '@/theme';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 5; // odd, so one row sits exactly on the center line
const HALF_VISIBLE = Math.floor(VISIBLE_COUNT / 2);
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** One row's fade/scale, driven purely by its distance from the wheel's current scroll center — no React state involved, so scrolling never triggers a re-render. */
const WheelRow: React.FC<{ label: string; index: number; scrollY: SharedValue<number>; color: string }> = React.memo(({ label, index, scrollY, color }) => {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(scrollY.value / ITEM_HEIGHT - index);
    return {
      opacity: interpolate(distance, [0, 1, 2], [1, 0.55, 0.22], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(distance, [0, 1, 2], [1, 0.93, 0.86], Extrapolation.CLAMP) }],
    };
  });
  return (
    <Animated.View style={[{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }, style]}>
      <AppText variant="headingSmall" weight="600" color={color} numberOfLines={1}>
        {label}
      </AppText>
    </Animated.View>
  );
});
WheelRow.displayName = 'WheelRow';

interface WheelColumnProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  textColor: string;
}

/** One spinning column (month, day, or year) — a plain `Animated.FlatList` with native snap-to-item scrolling, not a bespoke gesture implementation; `getItemLayout` + `snapToInterval` is what makes the momentum/snap feel native on both platforms. */
const WheelColumn: React.FC<WheelColumnProps> = React.memo(({ items, selectedIndex, onSelect, textColor }) => {
  const listRef = useAnimatedRef<Animated.FlatList<string>>();
  const scrollY = useSharedValue(selectedIndex * ITEM_HEIGHT);
  const isSettling = useRef(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  const commitFromOffset = useCallback(
    (offsetY: number) => {
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
      onSelect(idx);
    },
    [items.length, onSelect]
  );

  const handleMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      commitFromOffset(e.nativeEvent.contentOffset.y);
    },
    [commitFromOffset]
  );

  // A drag that ends without enough velocity to trigger momentum still
  // needs to settle — otherwise a slow drag can leave the wheel resting
  // between two rows instead of snapped to one.
  const handleDragEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isSettling.current) commitFromOffset(e.nativeEvent.contentOffset.y);
    },
    [commitFromOffset]
  );

  // Keep the wheel in sync when its selected index changes for a reason
  // other than the user scrolling this exact column — e.g. the day count
  // shrinking because the month changed, which can only ever push the
  // selection down (day 31 -> 30), or the field's value being set from
  // outside the picker.
  useEffect(() => {
    isSettling.current = true;
    listRef.current?.scrollToOffset({ offset: selectedIndex * ITEM_HEIGHT, animated: true });
    const t = setTimeout(() => {
      isSettling.current = false;
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, items.length]);

  return (
    <View style={{ flex: 1, height: WHEEL_HEIGHT, overflow: 'hidden' }}>
      <Animated.FlatList
        ref={listRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => <WheelRow label={item} index={index} scrollY={scrollY} color={textColor} />}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleDragEnd}
        initialScrollIndex={selectedIndex}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * HALF_VISIBLE }}
      />
    </View>
  );
});
WheelColumn.displayName = 'WheelColumn';

interface WheelDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Overrides the color tokens the wheel reads — used by `AppDateField` to force its own always-dark palette when opened over a hardcoded-dark hero background, instead of whatever `theme.colors` resolves to under the *system's* current light/dark setting. Falls back to the live theme when omitted. */
  colors?: ColorTokens;
}

/**
 * Longlivy's own month/day/year wheel picker — replaces the platform-native
 * date picker (a UIDatePicker wheel on iOS, a calendar dialog by default on
 * Android) with one component that looks and behaves identically on both,
 * styled in the app's own restrained/premium language instead of the
 * generic system chrome. Built entirely from `Animated.FlatList` +
 * `getItemLayout`/`snapToInterval` (native scroll-snap, no gesture library)
 * and Reanimated's `useAnimatedScrollHandler` for the row fade/scale, so
 * the depth effect runs on the UI thread — no state updates on scroll,
 * only when a column settles.
 */
export const WheelDatePicker: React.FC<WheelDatePickerProps> = ({ value, onChange, minimumDate, maximumDate, colors: colorsOverride }) => {
  const { theme } = useTheme();
  const colors: ColorTokens = colorsOverride ?? theme.colors;

  const [year, setYear] = useState(value.getFullYear());
  const [month, setMonth] = useState(value.getMonth());
  const [day, setDay] = useState(value.getDate());

  const minYear = minimumDate ? minimumDate.getFullYear() : year - 100;
  const maxYear = maximumDate ? maximumDate.getFullYear() : year + 100;
  const years = useMemo(() => Array.from({ length: Math.max(1, maxYear - minYear + 1) }, (_, i) => String(minYear + i)), [minYear, maxYear]);

  const dayCount = daysInMonth(year, month);
  const days = useMemo(() => Array.from({ length: dayCount }, (_, i) => String(i + 1)), [dayCount]);

  // A month change (or landing on a leap-year February) can leave the
  // previously-selected day out of range — clamp down rather than let the
  // day wheel point at a day that no longer exists for this month/year.
  useEffect(() => {
    if (day > dayCount) setDay(dayCount);
  }, [dayCount, day]);

  useEffect(() => {
    const candidate = new Date(year, month, Math.min(day, dayCount));
    let clamped = candidate;
    if (minimumDate && candidate.getTime() < minimumDate.getTime()) clamped = minimumDate;
    if (maximumDate && candidate.getTime() > maximumDate.getTime()) clamped = maximumDate;
    onChange(clamped);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, day]);

  const accent = colors.primary;

  return (
    <View style={{ height: WHEEL_HEIGHT }}>
      <View style={{ flexDirection: 'row' }}>
        <WheelColumn items={MONTH_NAMES} selectedIndex={month} onSelect={setMonth} textColor={colors.textPrimary} />
        <WheelColumn items={days} selectedIndex={Math.min(day, dayCount) - 1} onSelect={(i) => setDay(i + 1)} textColor={colors.textPrimary} />
        <WheelColumn items={years} selectedIndex={year - minYear} onSelect={(i) => setYear(minYear + i)} textColor={colors.textPrimary} />
      </View>

      {/* The selection window — a thin accent-bordered band across all
          three columns marking the center row, plus soft top/bottom fades
          so rows appear to recede into the surface rather than end with a
          hard edge. Purely decorative (pointerEvents none): the columns
          underneath handle all the actual scrolling. */}
      <View pointerEvents="none" style={{ position: 'absolute', top: ITEM_HEIGHT * HALF_VISIBLE, left: 0, right: 0, height: ITEM_HEIGHT }}>
        <View style={{ flex: 1, borderTopWidth: 1, borderBottomWidth: 1, borderColor: `${accent}55`, backgroundColor: `${accent}12` }} />
      </View>
      <LinearGradient pointerEvents="none" colors={[colors.surface, `${colors.surface}00`]} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT * HALF_VISIBLE }} />
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.surface}00`, colors.surface]}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT * HALF_VISIBLE }}
      />
    </View>
  );
};
