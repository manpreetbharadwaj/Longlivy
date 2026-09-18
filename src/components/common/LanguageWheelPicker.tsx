import React, { useCallback, useState } from 'react';
import { View, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useAnimatedRef,
  useAnimatedReaction,
  runOnJS,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { FlagIcon } from './FlagIcon';
import { GlowOrb } from './GlowOrb';
import { LanguageDefinition } from '@/config/languages';

const ITEM_HEIGHT = 56;
const VISIBLE_COUNT = 5; // odd, so one row sits exactly on the center line
const HALF_VISIBLE = Math.floor(VISIBLE_COUNT / 2);
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;
const PERSPECTIVE = 900;

interface RowProps {
  language: LanguageDefinition;
  index: number;
  scrollY: SharedValue<number>;
  centerColor: string;
  regularColor: string;
}

/**
 * One row's full depth treatment — driven purely by its signed distance
 * from the wheel's current scroll center, entirely on the UI thread (no
 * React state, so scrolling never triggers a re-render and the effect
 * updates continuously during a drag, not just once it settles).
 *
 * Deliberately no card/border/background anywhere in this file — depth
 * reads through `rotateX` + `scale` + `translateY` + `opacity` alone, so
 * the wheel has nothing to visually separate it from
 * `OnboardingBackground` sitting behind it.
 */
const LanguageWheelRow: React.FC<RowProps> = React.memo(({ language, index, scrollY, centerColor, regularColor }) => {
  const style = useAnimatedStyle(() => {
    const d = index - scrollY.value / ITEM_HEIGHT; // signed: negative = above center, positive = below
    const abs = Math.min(Math.abs(d), 2);
    return {
      opacity: interpolate(abs, [0, 1, 2], [1, 0.62, 0.3], Extrapolation.CLAMP),
      transform: [
        { perspective: PERSPECTIVE },
        { rotateX: `${interpolate(d, [-2, 0, 2], [42, 0, -42], Extrapolation.CLAMP)}deg` },
        { scale: interpolate(abs, [0, 1, 2], [1.14, 0.85, 0.7], Extrapolation.CLAMP) },
        { translateY: interpolate(d, [-2, 0, 2], [7, 0, -7], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Animated.View style={[{ height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, style]}>
      <FlagRow language={language} scrollY={scrollY} index={index} />
      <AnimatedLabel language={language} scrollY={scrollY} index={index} centerColor={centerColor} regularColor={regularColor} />
    </Animated.View>
  );
});
LanguageWheelRow.displayName = 'LanguageWheelRow';

/** The flag's own subtle brightening at center — kept smaller than the text throughout so it assists identification without dominating the row. */
const FlagRow: React.FC<{ language: LanguageDefinition; scrollY: SharedValue<number>; index: number }> = React.memo(({ language, scrollY, index }) => {
  const style = useAnimatedStyle(() => {
    const abs = Math.min(Math.abs(index - scrollY.value / ITEM_HEIGHT), 2);
    return { opacity: interpolate(abs, [0, 1, 2], [1, 0.75, 0.5], Extrapolation.CLAMP) };
  });
  return (
    <Animated.View style={[{ marginRight: 10 }, style]}>
      <FlagIcon countryCode={language.countryCode} size={22} />
    </Animated.View>
  );
});
FlagRow.displayName = 'FlagRow';

/**
 * The native-name text itself, colored on the UI thread (bright near-white
 * when centered, cool blue-grey otherwise) without a JS re-render per
 * scroll frame. Reanimated can't cheaply interpolate an arbitrary `color`
 * string swap here, so centered/not is expressed as two absolutely-stacked
 * `AppText`s cross-fading via opacity instead.
 */
const AnimatedLabel: React.FC<{ language: LanguageDefinition; scrollY: SharedValue<number>; index: number; centerColor: string; regularColor: string }> = React.memo(
  ({ language, scrollY, index, centerColor, regularColor }) => {
    const centerStyle = useAnimatedStyle(() => {
      const d = Math.abs(index - scrollY.value / ITEM_HEIGHT);
      return { opacity: interpolate(d, [0, 0.5], [1, 0], Extrapolation.CLAMP) };
    });
    const regularStyle = useAnimatedStyle(() => {
      const d = Math.abs(index - scrollY.value / ITEM_HEIGHT);
      return { opacity: interpolate(d, [0, 0.5], [0, 1], Extrapolation.CLAMP) };
    });
    // Both variants share the same font size/weight deliberately — the
    // row-level `scale` transform (see `LanguageWheelRow`) is what makes
    // the centered row read as bigger; doubling that up here by also
    // giving the centered text its own larger variant made the absolutely-
    // positioned copy inherit its container's width from the *other*
    // (smaller, normal-flow) copy and clip with an ellipsis on wider
    // scripts (caught on Hindi: "हिन्दी" → "हि…"). One shared size avoids
    // the mismatch entirely.
    return (
      <View>
        <Animated.View style={[{ position: 'absolute' }, centerStyle]}>
          <AppText variant="headingSmall" weight="700" color={centerColor} numberOfLines={1}>
            {language.nativeName}
          </AppText>
        </Animated.View>
        <Animated.View style={regularStyle}>
          <AppText variant="headingSmall" weight="500" color={regularColor} numberOfLines={1}>
            {language.nativeName}
          </AppText>
        </Animated.View>
      </View>
    );
  }
);
AnimatedLabel.displayName = 'AnimatedLabel';

interface LanguageWheelPickerProps {
  languages: LanguageDefinition[];
  selectedCode: string;
  onChange: (code: string) => void;
  /** Cyan brand accent — used only for the soft ambient glow behind the centered row, never as text color (keeps the center label near-white and easy to read). */
  glowColor: string;
  /** Near-white — the centered row's text color. */
  centerColor: string;
  /** Cool blue-grey — every other row's text color, before the row's own distance-based opacity dims it further. */
  regularColor: string;
  hapticsEnabled?: boolean;
}

/**
 * A single spinning column of languages — flag + native name, snapping to
 * the centered row, reading as languages floating in front of the app's
 * own background rather than a picker placed inside a card. Built on the
 * same base primitives as `WheelDatePicker` (`Animated.FlatList` +
 * `getItemLayout` + `snapToInterval` for native momentum/snap), extended
 * with the cylindrical depth treatment in `LanguageWheelRow` above.
 */
export const LanguageWheelPicker: React.FC<LanguageWheelPickerProps> = ({ languages, selectedCode, onChange, glowColor, centerColor, regularColor, hapticsEnabled = true }) => {
  const listRef = useAnimatedRef<Animated.FlatList<LanguageDefinition>>();
  const initialIndex = Math.max(0, languages.findIndex((l) => l.code === selectedCode));
  const scrollY = useSharedValue(initialIndex * ITEM_HEIGHT);
  const centeredIndex = useSharedValue(initialIndex);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
      centeredIndex.value = Math.max(0, Math.min(languages.length - 1, Math.round(e.contentOffset.y / ITEM_HEIGHT)));
    },
  });

  const fireHaptic = useCallback(() => {
    if (hapticsEnabled) Haptics.selectionAsync();
  }, [hapticsEnabled]);

  // Fires once per row crossed — as the wheel passes each language, not on
  // every scroll frame — continuously during a drag, same as a native iOS
  // picker's tick, not only once the wheel comes to rest.
  useAnimatedReaction(
    () => centeredIndex.value,
    (current, previous) => {
      if (previous !== null && current !== previous) runOnJS(fireHaptic)();
    }
  );

  const commitFromOffset = useCallback(
    (offsetY: number) => {
      const idx = Math.max(0, Math.min(languages.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
      const code = languages[idx]?.code;
      if (code) onChange(code);
    },
    [languages, onChange]
  );

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.y), [commitFromOffset]);
  // A drag that ends without enough velocity to trigger momentum still needs
  // to settle — otherwise a slow drag can leave the wheel resting between
  // two rows instead of snapped to one. Same reasoning as `WheelDatePicker`.
  const handleDragEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => commitFromOffset(e.nativeEvent.contentOffset.y), [commitFromOffset]);

  const [width, setWidth] = useState(0);
  const handleLayout = useCallback((e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width), []);
  const glowSize = WHEEL_HEIGHT * 0.9;

  return (
    <View style={{ height: WHEEL_HEIGHT, overflow: 'hidden' }} onLayout={handleLayout}>
      {/* Extremely subtle center illumination — not a panel: a soft radial glow, well short of the row's own width, fading completely to nothing before it could read as a shape. Pure depth cue, no edges. */}
      {width > 0 ? (
        <GlowOrb size={glowSize} color={glowColor} opacity={0.1} style={{ top: WHEEL_HEIGHT * 0.05, left: width / 2 - glowSize / 2 }} />
      ) : null}
      <Animated.FlatList
        ref={listRef}
        data={languages}
        keyExtractor={(item) => item.code}
        renderItem={({ item, index }) => <LanguageWheelRow language={item} index={index} scrollY={scrollY} centerColor={centerColor} regularColor={regularColor} />}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollEndDrag={handleDragEnd}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT * HALF_VISIBLE }}
      />
    </View>
  );
};
