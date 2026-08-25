import React from 'react';
import { ScrollViewProps } from 'react-native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';

interface FastingHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The "different atmosphere" for fasting the design brief asked for — a
 * thin wrapper around `SectionHeroLayout` using the `fasting` section
 * environment (own cooler, cyan-forward gradient, see
 * `theme/environments.ts`) so it reads as a distinct mode, not a copy of
 * onboarding. Used by both ActiveFastScreen and FastingStartedScreen so the
 * whole "start a fast" moment shares one consistent atmosphere.
 */
export const FastingHeroLayout: React.FC<FastingHeroLayoutProps> = (props) => (
  <SectionHeroLayout environment={sectionEnvironments.fasting} {...props} />
);
