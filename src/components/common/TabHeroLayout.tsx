import React from 'react';
import { ScrollViewProps } from 'react-native';
import { SectionHeroLayout } from './SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';

interface TabHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The shared dark-hero shell for main tab/profile screens — a thin wrapper
 * around `SectionHeroLayout` using the `generic` section environment (see
 * `theme/environments.ts`). Distinct from FastingHeroLayout/ActivityHeroLayout/
 * MeditationHeroLayout (their own environments) — this one is the
 * general-purpose version for screens without a dedicated atmosphere yet.
 */
export const TabHeroLayout: React.FC<TabHeroLayoutProps> = (props) => (
  <SectionHeroLayout environment={sectionEnvironments.generic} {...props} />
);
