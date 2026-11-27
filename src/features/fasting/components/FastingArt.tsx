import React, { useId, useMemo } from 'react';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Glow, H, SceneProps, Sky, Stars, W, ridgePath, seededRandom } from '@/components/common/SceneArt';
import { FastingMethodId } from '../models';

/**
 * One scene per fasting "mood" rather than one per method id (ten hand-drawn
 * scenes would be a lot of near-duplicate art for little gain) — the five
 * daily rhythms plus the open-ended custom split map onto six kinds; every
 * multi-day "longer" method (24h-96h) shares `extended`, since they're all
 * the same kind of fast at different lengths, not visually distinct ideas.
 */
export type FastingArtKind = 'dawn' | 'balanced' | 'focus' | 'warrior' | 'extended' | 'custom';

export function getFastingArtKind(methodId: FastingMethodId): FastingArtKind {
  switch (methodId) {
    case '14:10':
      return 'dawn';
    case '16:8':
      return 'balanced';
    case '18:6':
      return 'focus';
    case '20:4':
      return 'warrior';
    case 'individual':
      return 'custom';
    default:
      return 'extended';
  }
}

/** A gentle entry point — low warm sunrise glow just clearing the horizon. */
const Dawn: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#1B1420', '#3A2A33', '#6B4A49']} />
    <Glow gid={gid} name="sun" cx={100} cy={96} r={70} color="#E3A867" opacity={0.42} />
    <Circle cx={100} cy={96} r={14} fill="#F0C98A" opacity={0.9} />
    <Path d={ridgePath(98, 10, 1.3, 0.6)} fill="#241A22" />
  </>
);

/** The most common rhythm — an evenly split sky either side of a centered glow, reading as balance. */
const Balanced: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Defs>
      <LinearGradient id={`${gid}half`} x1="0" y1="0" x2="1" y2="0">
        <Stop offset="0" stopColor="#2A2130" />
        <Stop offset="0.5" stopColor="#4B3B45" />
        <Stop offset="1" stopColor="#223027" />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={W} height={H} fill={`url(#${gid}half)`} />
    <Glow gid={gid} name="core" cx={100} cy={58} r={46} color="#CBA05F" opacity={0.3} />
    <Circle cx={100} cy={58} r={13} fill="#E9CE94" opacity={0.92} />
    <Path d={ridgePath(86, 8, 1.4, 1.1)} fill="#1E1A22" opacity={0.85} />
    <Line x1={100} y1={18} x2={100} y2={100} stroke="#8B7FA8" strokeOpacity={0.3} strokeWidth={0.8} strokeDasharray="2 4" />
  </>
);

/** A tighter, more disciplined window — a sharper glow ringed by faint concentric focus lines. */
const Focus: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#121018', '#211C2C', '#342A45']} />
    {[18, 30, 44].map((r, i) => (
      <Circle key={r} cx={100} cy={54} r={r} fill="none" stroke="#A893C7" strokeOpacity={0.22 - i * 0.05} strokeWidth={1} />
    ))}
    <Glow gid={gid} name="core" cx={100} cy={54} r={30} color="#A893C7" opacity={0.34} />
    <Circle cx={100} cy={54} r={8} fill="#D9C9F0" opacity={0.92} />
    <Path d={ridgePath(92, 6, 2.2, 0.2)} fill="#19141F" />
  </>
);

/** An advanced daily rhythm — a bold, jagged silhouette against a near-black sky signals more intensity. */
const Warrior: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0B0A10', '#17121D', '#241828']} />
    <Glow gid={gid} name="core" cx={150} cy={34} r={30} color="#C9A0D9" opacity={0.3} />
    <Circle cx={150} cy={34} r={6} fill="#E7CFFF" opacity={0.85} />
    <Path d="M-6 120 L40 70 L70 92 L110 48 L150 86 L200 60 L200 120 Z" fill="#17121C" />
    <Path d="M110 48 L150 86 L126 86 Z" fill="#241B2C" opacity={0.85} />
  </>
);

/** Multi-day fasts (24h-96h) all share this deeper, star-lit scene — a deliberately distinct, more dramatic style for the more intensive option. */
const Extended: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#07070C', '#0F0E18', '#1A1726']} />
    <Stars rand={rand} count={18} maxY={70} />
    <Glow gid={gid} name="moon" cx={150} cy={30} r={34} color="#CFC6EA" opacity={0.3} />
    <Circle cx={150} cy={30} r={11} fill="#E7E2F5" opacity={0.92} />
    <Path d={ridgePath(80, 10, 1.1, 0.5)} fill="#141020" />
    <Path d={ridgePath(98, 14, 0.8, 2.3)} fill="#0D0B16" />
  </>
);

/** Custom/individual — an open dial motif (not a landscape) signalling "set it yourself" rather than a fixed rhythm. */
const Custom: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#14101A', '#211A2C', '#2E2440']} />
    <Defs>
      <LinearGradient id={`${gid}arc`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#8B7FA8" stopOpacity={0.75} />
        <Stop offset="1" stopColor="#564B6E" stopOpacity={0.08} />
      </LinearGradient>
    </Defs>
    {[16, 30, 46, 64].map((r, i) => (
      <Path key={r} d={`M${100 - r} 74 A ${r} ${r} 0 0 1 ${100 + r} 74`} fill="none" stroke={`url(#${gid}arc)`} strokeWidth={2.2 - i * 0.3} strokeLinecap="round" />
    ))}
    <Circle cx={100} cy={74} r={5} fill="#E3DAF2" opacity={0.9} />
  </>
);

const SCENES: Record<FastingArtKind, React.FC<SceneProps>> = {
  dawn: Dawn,
  balanced: Balanced,
  focus: Focus,
  warrior: Warrior,
  extended: Extended,
  custom: Custom,
};

/** Calm, restrained scenery per fasting mood — the same drawing kit and palette as Activity/Meditation's artwork, so all three pillars read as one app. */
export const FastingArt: React.FC<{ kind: FastingArtKind; seed?: string }> = React.memo(({ kind, seed = kind }) => {
  const rawId = useId();
  const gid = useMemo(() => `fa${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const Scene = SCENES[kind];
  const rand = seededRandom(`${kind}:${seed}`);
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Scene gid={gid} rand={rand} />
    </Svg>
  );
});
FastingArt.displayName = 'FastingArt';
