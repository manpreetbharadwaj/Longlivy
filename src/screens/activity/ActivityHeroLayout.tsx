import React from 'react';
import { ScrollViewProps } from 'react-native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';

interface ActivityHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
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
