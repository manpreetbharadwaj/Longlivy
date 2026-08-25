import React from 'react';
import { ScrollViewProps } from 'react-native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';

interface MeditationHeroLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  scroll?: boolean;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
}

/**
 * The "different atmosphere" for a live meditation session — a thin wrapper
 * around `SectionHeroLayout` using the `meditation` section environment
 * (own deep-violet gradient with pulsing, slow-breathing glow orbs instead
 * of the static ones used elsewhere, see `theme/environments.ts`) — the
 * design brief's "calm" mode should feel different in motion, not just
 * color. Used by MeditationPlayerScreen and BreathingExerciseScreen so the
 * whole "sit with a session" moment shares one atmosphere.
 */
export const MeditationHeroLayout: React.FC<MeditationHeroLayoutProps> = (props) => (
  <SectionHeroLayout environment={sectionEnvironments.meditation} {...props} />
);
