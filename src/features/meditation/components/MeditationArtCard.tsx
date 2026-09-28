import React from 'react';
import { SceneCard } from '@/components/common/SceneCard';
import { MeditationArt, MeditationArtKind } from './MeditationArt';

type SceneCardProps = React.ComponentProps<typeof SceneCard>;

interface MeditationArtCardProps extends Omit<SceneCardProps, 'art'> {
  kind: MeditationArtKind;
  seed?: string;
}

/** A SceneCard showing one of the Meditation scenes - for collections, sounds and practices. */
export const MeditationArtCard: React.FC<MeditationArtCardProps> = React.memo(({ kind, seed, ...rest }) => <SceneCard art={<MeditationArt kind={kind} seed={seed} />} {...rest} />);
MeditationArtCard.displayName = 'MeditationArtCard';
