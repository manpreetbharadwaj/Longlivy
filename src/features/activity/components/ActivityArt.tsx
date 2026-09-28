import React, { useId, useMemo } from 'react';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Glow, H, Pines, SceneProps, Sky, W, ridgePath, seededRandom } from '@/components/common/SceneArt';
import { ActivityType } from '../models';

export type ActivityArtKind = 'running' | 'walking' | 'cycling' | 'hiking' | 'other';

/** 'jogging' is retired from the picker but still a valid stored type - it reads as running. */
export function getActivityArtKind(type: ActivityType): ActivityArtKind {
  return type === 'jogging' ? 'running' : type;
}

const Running: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#121821', '#26313D', '#5A5148']} />
    <Glow gid={gid} name="sun" cx={100} cy={64} r={56} color="#E0B98A" opacity={0.36} />
    <Circle cx={100} cy={64} r={9} fill="#EBCB9C" opacity={0.92} />
    <Path d={ridgePath(68, 6, 1.6, 0.9)} fill="#1D2630" />
    <Path d="M0 120 L94 66 L106 66 L200 120 Z" fill="#232B34" />
    <Path d="M94 66 L106 66 L120 120 L80 120 Z" fill="#2C3641" opacity={0.6} />
    {[76, 84, 95, 108].map((y, i) => (
      <Line key={y} x1={100} y1={y} x2={100} y2={y + 4 + i * 2.5} stroke="#D9D2C2" strokeOpacity={0.55} strokeWidth={0.8 + i * 0.5} strokeLinecap="round" />
    ))}
  </>
);

const Walking: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0F1C1B', '#1F3530', '#3C5546']} />
    <Glow gid={gid} name="sun" cx={150} cy={38} r={50} color="#C8D8A8" opacity={0.28} />
    <Path d={ridgePath(78, 8, 1.1, 0.3)} fill="#213A31" />
    {Array.from({ length: 6 }).map((_, i) => {
      const x = 14 + i * 34 + rand() * 12;
      const y = 74 + rand() * 12;
      return (
        <G key={i}>
          <Rect x={x - 1} y={y} width={2} height={12} fill="#16241E" />
          <Circle cx={x} cy={y - 3} r={9 + rand() * 4} fill="#19301F" opacity={0.95} />
        </G>
      );
    })}
    <Path d="M-10 120 C 60 96, 90 100, 116 84 C 134 74, 160 76, 210 70 L210 120 Z" fill="#26362E" />
    <Path d="M40 120 C 76 100, 104 96, 122 84 C 140 74, 168 74, 200 72" fill="none" stroke="#D3D8C2" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" />
  </>
);

const Cycling: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0F1A26', '#1E3346', '#3D5A70']} />
    <Glow gid={gid} name="sun" cx={40} cy={40} r={44} color="#DCE8F0" opacity={0.28} />
    <Circle cx={40} cy={40} r={8} fill="#E8F0F4" opacity={0.85} />
    <Path d={ridgePath(70, 16, 1.0, 0.4)} fill="#1C3140" />
    <Path d={ridgePath(88, 14, 1.4, 2.0)} fill="#152836" />
    <Path d="M-10 108 C 40 96, 80 104, 120 90 C 150 80, 178 84, 210 72" fill="none" stroke="#D9E2E8" strokeOpacity={0.42} strokeWidth={4} strokeLinecap="round" />
    <Path d="M-10 108 C 40 96, 80 104, 120 90 C 150 80, 178 84, 210 72" fill="none" stroke="#0E1C27" strokeOpacity={0.6} strokeWidth={0.8} strokeDasharray="5 5" />
    <Rect x={0} y={108} width={W} height={12} fill="#0F202C" />
  </>
);

const Hiking: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0E141C', '#1B2836', '#34485A']} />
    <Glow gid={gid} name="haze" cx={120} cy={44} r={60} color="#B8CADB" opacity={0.2} />
    <Path d="M-6 92 L46 40 L74 68 L112 22 L160 74 L184 54 L206 92 Z" fill="#1C2A38" />
    <Path d="M112 22 L160 74 L128 74 Z" fill="#30455A" opacity={0.85} />
    <Path d="M104 34 L112 22 L120 33 L113 30 Z" fill="#E6EDF3" opacity={0.8} />
    <Path d="M-6 108 L36 82 L84 100 L126 78 L170 98 L206 84 L206 120 L-6 120 Z" fill="#132029" />
    <Pines rand={rand} baseY={116} minH={12} maxH={22} step={14} color="#0D1A20" />
    <Path d="M30 118 L58 104 L46 98 L84 88" fill="none" stroke="#DCD6C4" strokeOpacity={0.5} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 3" />
  </>
);

const Other: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#10171E', '#192531', '#26384A']} />
    <Defs>
      <LinearGradient id={`${gid}arc`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#7A97B0" stopOpacity={0.7} />
        <Stop offset="1" stopColor="#5C7A94" stopOpacity={0.05} />
      </LinearGradient>
    </Defs>
    {[18, 32, 48, 66].map((r, i) => (
      <Path key={r} d={`M${100 - r} 96 A ${r} ${r} 0 0 1 ${100 + r} 96`} fill="none" stroke={`url(#${gid}arc)`} strokeWidth={2.4 - i * 0.35} strokeLinecap="round" />
    ))}
    <Circle cx={100} cy={96} r={5} fill="#DCE6EE" opacity={0.9} />
    <Line x1={20} y1={96} x2={180} y2={96} stroke="#7A97B0" strokeOpacity={0.25} strokeWidth={0.8} />
  </>
);

const SCENES: Record<ActivityArtKind, React.FC<SceneProps>> = { running: Running, walking: Walking, cycling: Cycling, hiking: Hiking, other: Other };

/** Calm, restrained scenery for each activity - the same drawing kit and palette as the Meditation artwork, so the two areas read as one app. */
export const ActivityArt: React.FC<{ kind: ActivityArtKind; seed?: string }> = React.memo(({ kind, seed = kind }) => {
  const rawId = useId();
  const gid = useMemo(() => `a${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const Scene = SCENES[kind];
  const rand = seededRandom(`${kind}:${seed}`);
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Scene gid={gid} rand={rand} />
    </Svg>
  );
});
ActivityArt.displayName = 'ActivityArt';
