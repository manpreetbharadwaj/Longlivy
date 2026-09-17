import React from 'react';
import { ScrollViewProps, ImageSourcePropType } from 'react-native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';

interface ActivityHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
  /** Forwarded to `SectionHeroLayout` — an activity-type photo behind the atmosphere gradient, for the "Activity Mode" full-screen moment. */
  backgroundImageSource?: ImageSourcePropType;
  backgroundImageGradientOpacity?: number;
}

/**
 * The "different atmosphere" for a live activity session — a thin wrapper
 * around `SectionHeroLayout` using the `activity` section environment (own
 * deep-navy-to-blue gradient, see `theme/environments.ts`) so tracking a
 * workout reads as its own kinetic mode rather than a re-skin of fasting's
 * cooler "lab" atmosphere. Used by ActiveActivityScreen and
 * ActivitySummaryScreen so the whole "track a workout" moment — start to
 * finish — shares one consistent feel.
 */
export const ActivityHeroLayout: React.FC<ActivityHeroLayoutProps> = (props) => (
  <SectionHeroLayout environment={sectionEnvironments.activity} {...props} />
);
