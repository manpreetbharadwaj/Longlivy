import React from 'react';
import { View, Pressable, StatusBar, RefreshControl, ScrollViewProps } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { AnimatedRef, ScrollHandlerProcessed } from 'react-native-reanimated';
import { AppText } from './AppText';
import { AppIcon } from './AppIcon';
import { GlowOrb } from './GlowOrb';
import { useTheme } from '@/hooks/useTheme';
import { SectionEnvironment } from '@/theme/environments';
import { useFloatingTabBarSpacing } from '@/navigation/components/useFloatingTabBarSpacing';

interface SectionHeroLayoutProps {
  environment: SectionEnvironment;
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  /** Full override of the default back/title header row. */
  header?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  scrollRef?: AnimatedRef<Animated.ScrollView>;
  onScroll?: ScrollHandlerProcessed<Record<string, unknown>>;
  edges?: Edge[];
  applyTabBarSpacing?: boolean;
}

/**
 * The single shared implementation behind every dark "hero" atmosphere in
 * the app (Home, Fasting, Activity, Nutrition, Meditation, Statistics, plus
 * the generic tab shell) — root View → StatusBar → full-bleed
 * LinearGradient → GlowOrb(s) → SafeAreaView → optional header → scroll
 * content. Each section supplies its own `environment` (gradient + orb
 * recipe, see `theme/environments.ts`); the structural shell itself never
 * changes, which is what keeps every section feeling like one app in
 * different moods rather than unrelated screens.
 */
export const SectionHeroLayout: React.FC<SectionHeroLayoutProps> = ({
  environment,
  children,
  title,
  onBack,
  rightElement,
  header,
  scroll = true,
  refreshing,
  onRefresh,
  contentContainerStyle,
  keyboardShouldPersistTaps,
  scrollRef,
  onScroll,
  edges = ['top', 'left', 'right'],
  applyTabBarSpacing = true,
}) => {
  const { theme } = useTheme();
  // The floating tab bar is an absolutely-positioned overlay, not a docked
  // bar that reserves its own layout space — so every screen under it has
  // to add this manually, or its last item can end up underneath the pill.
  // Always called (Rules of Hooks) — `applyTabBarSpacing` only gates whether
  // the result is used, not whether the hook runs.
  const measuredTabBarSpacing = useFloatingTabBarSpacing();
  const tabBarSpacing = applyTabBarSpacing ? measuredTabBarSpacing : 0;

  const defaultHeader =
    onBack || title || rightElement ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        {onBack ? (
          <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} style={{ width: 32 }}>
            <AppIcon name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
        ) : (
          <View style={{ width: 32 }} />
        )}
        {title ? (
          <AppText variant="headingMedium" color="#FFFFFF" align="center" style={{ flex: 1 }}>
            {title}
          </AppText>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <View style={{ width: 32, alignItems: 'flex-end' }}>{rightElement}</View>
      </View>
    ) : null;

  const headerContent = header !== undefined ? header : defaultHeader;

  return (
    <View style={{ flex: 1, backgroundColor: environment.gradient[0] }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={environment.gradient} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      {environment.orbs.map((orb, index) => (
        <GlowOrb key={index} size={orb.size} color={orb.color} opacity={orb.opacity} pulse={orb.pulse} style={orb.style} />
      ))}
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {scroll ? (
          <Animated.ScrollView
            ref={scrollRef}
            onScroll={onScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            contentContainerStyle={[
              { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl + tabBarSpacing },
              contentContainerStyle,
            ]}
            refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" /> : undefined}
          >
            {headerContent}
            {children}
          </Animated.ScrollView>
        ) : (
          <View style={{ flex: 1, padding: theme.spacing.md, paddingBottom: theme.spacing.md + tabBarSpacing }}>
            {headerContent}
            {children}
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};
