import React from 'react';
import { SceneCard } from '@/components/common/SceneCard';
import { FastingArt, FastingArtKind } from './FastingArt';

type SceneCardProps = React.ComponentProps<typeof SceneCard>;

interface FastingArtCardProps extends Omit<SceneCardProps, 'art'> {
  kind: FastingArtKind;
  seed?: string;
}

/** A SceneCard showing one of the Fasting mood scenes — for the method picker, the same family Activity/Meditation already use for theirs. */
export const FastingArtCard: React.FC<FastingArtCardProps> = React.memo(({ kind, seed, ...rest }) => <SceneCard art={<FastingArt kind={kind} seed={seed} />} {...rest} />);
FastingArtCard.displayName = 'FastingArtCard';
