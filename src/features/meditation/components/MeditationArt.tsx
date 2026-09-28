import React, { useId, useMemo } from 'react';
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Glow, H, Pines, SceneProps, Sky, Stars, W, f, ridgePath, seededRandom, wavePath } from '@/components/common/SceneArt';
import { Meditation, MeditationTopic } from '../models';
import { AmbientSoundType } from '../ambientSounds';

export type MeditationArtKind =
  | 'sleep'
  | 'stress_relaxation'
  | 'focus'
  | 'nature'
  | 'morning'
  | 'mindfulness'
  | 'energy'
  | 'calm'
  | 'rain'
  | 'ocean'
  | 'forest'
  | 'fire'
  | 'ambient'
  | 'guided'
  | 'unguided'
  | 'breathing';

const TOPIC_ART: Record<MeditationTopic, MeditationArtKind> = {
  sleep: 'sleep',
  stress_relief: 'stress_relaxation',
  relaxation: 'stress_relaxation',
  focus: 'focus',
  calm: 'calm',
  morning: 'morning',
  mindfulness: 'mindfulness',
  energy: 'energy',
};

const AMBIENT_ART: Record<AmbientSoundType, MeditationArtKind> = {
  rain: 'rain',
  ocean: 'ocean',
  forest: 'forest',
  fire: 'fire',
  ambient: 'ambient',
};

const SOUND_REFERENCE_ART: Record<string, MeditationArtKind> = {
  ambient_rain_soft: 'rain',
  ambient_ocean_swells: 'ocean',
  ambient_forest_spring: 'forest',
  ambient_fire_campfire: 'fire',
  ambient_neutral_pad: 'ambient',
};

export function getAmbientArtKind(type: AmbientSoundType): MeditationArtKind {
  return AMBIENT_ART[type];
}

/** An item that is itself a pure recording (rain, ocean...) gets that sound's scene; everything else gets its topic's scene. */
export function getMeditationArtKind(meditation: Pick<Meditation, 'category' | 'audioReference'>): MeditationArtKind {
  if (meditation.audioReference && SOUND_REFERENCE_ART[meditation.audioReference]) return SOUND_REFERENCE_ART[meditation.audioReference];
  return TOPIC_ART[meditation.category];
}

const Sleep: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0B0F1E', '#141B36', '#1D2647']} />
    <Stars rand={rand} count={30} />
    <Glow gid={gid} name="moonhalo" cx={148} cy={36} r={36} color="#DAD8F0" opacity={0.28} />
    <Circle cx={148} cy={36} r={11} fill="#ECE9DD" opacity={0.95} />
    <Circle cx={144} cy={33} r={2.2} fill="#D6D2C2" opacity={0.5} />
    <Circle cx={152} cy={40} r={1.6} fill="#D6D2C2" opacity={0.45} />
    <Path d={ridgePath(96, 14, 1.3, 0.6)} fill="#121834" />
    <Path d={ridgePath(108, 10, 1.9, 2.4)} fill="#0C1128" />
  </>
);

const StressRelaxation: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#182524', '#2C3F38', '#4A5A48']} />
    <Glow gid={gid} name="sun" cx={100} cy={76} r={52} color="#D8C79A" opacity={0.4} />
    <Circle cx={100} cy={76} r={15} fill="#E2D2A2" opacity={0.92} />
    <Path d={ridgePath(80, 7, 1.2, 1.1)} fill="#22302B" opacity={0.9} />
    <Rect x={0} y={78} width={W} height={42} fill="#16201F" />
    <Rect x={0} y={78} width={W} height={42} fill="#2A3B36" opacity={0.35} />
    {[0, 1, 2, 3, 4].map((i) => (
      <Line key={i} x1={100 - (22 - i * 3.6)} y1={83 + i * 7} x2={100 + (22 - i * 3.6)} y2={83 + i * 7} stroke="#E2D2A2" strokeOpacity={0.5 - i * 0.08} strokeWidth={1.6} strokeLinecap="round" />
    ))}
  </>
);

const Focus: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0C131B', '#172431', '#2A3E52']} />
    {[14, 26, 40].map((r, i) => (
      <Circle key={r} cx={100} cy={50} r={r} fill="none" stroke="#7A97B0" strokeOpacity={0.3 - i * 0.08} strokeWidth={0.8} />
    ))}
    <Circle cx={100} cy={50} r={2.2} fill="#DCE6EE" opacity={0.9} />
    <Path d="M20 84 L100 36 L180 84 Z" fill="#182431" />
    <Path d="M100 36 L180 84 L112 84 Z" fill="#2A3E52" opacity={0.85} />
    <Rect x={0} y={84} width={W} height={36} fill="#0F1A25" />
    <Path d="M20 84 L100 132 L180 84 Z" fill="#182431" opacity={0.4} />
    <Line x1={0} y1={84} x2={W} y2={84} stroke="#7A97B0" strokeOpacity={0.35} strokeWidth={0.8} />
  </>
);

const Nature: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0E1B16', '#1B3025', '#2C4736']} />
    <Glow gid={gid} name="sun" cx={140} cy={44} r={48} color="#A9C79A" opacity={0.32} />
    <Path d={ridgePath(74, 10, 1.1, 0.4)} fill="#22392C" opacity={0.9} />
    <Pines rand={rand} baseY={92} minH={16} maxH={30} step={11} color="#1B3025" />
    <Defs>
      <LinearGradient id={`${gid}mist`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#CFE0D2" stopOpacity={0} />
        <Stop offset="1" stopColor="#CFE0D2" stopOpacity={0.16} />
      </LinearGradient>
    </Defs>
    <Rect x={0} y={70} width={W} height={34} fill={`url(#${gid}mist)`} />
    <Pines rand={rand} baseY={112} minH={22} maxH={42} step={13} color="#12231A" />
    <Rect x={0} y={108} width={W} height={12} fill="#0D1A13" />
  </>
);

const Morning: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#221C1A', '#43362B', '#75593F']} />
    <Glow gid={gid} name="sun" cx={100} cy={84} r={64} color="#E4BC7E" opacity={0.42} />
    {Array.from({ length: 9 }).map((_, i) => {
      const a = Math.PI + ((i + 0.5) / 9) * Math.PI;
      return <Line key={i} x1={f(100 + Math.cos(a) * 26)} y1={f(84 + Math.sin(a) * 26)} x2={f(100 + Math.cos(a) * 60)} y2={f(84 + Math.sin(a) * 60)} stroke="#E4BC7E" strokeOpacity={0.16} strokeWidth={1.2} strokeLinecap="round" />;
    })}
    <Circle cx={100} cy={84} r={18} fill="#E8C688" opacity={0.95} />
    <Path d={ridgePath(92, 10, 1.4, 0.8)} fill="#2C231D" />
    <Path d={ridgePath(106, 8, 2.1, 2.9)} fill="#1B1512" />
  </>
);

const Mindfulness: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0C1B1E', '#15292D', '#20403F']} />
    <Glow gid={gid} name="center" cx={100} cy={64} r={70} color="#8FBFC0" opacity={0.16} />
    {[10, 22, 36, 52, 70, 90].map((rx, i) => (
      <Ellipse key={rx} cx={100} cy={64} rx={rx} ry={rx * 0.36} fill="none" stroke="#A8CFCF" strokeOpacity={0.5 - i * 0.07} strokeWidth={1} />
    ))}
    <Ellipse cx={100} cy={66} rx={7} ry={2.6} fill="#000000" opacity={0.25} />
    <Circle cx={100} cy={61} r={5} fill="#D3E2E0" opacity={0.92} />
  </>
);

const Energy: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#1E1812', '#33261A', '#4F3A22']} />
    <Glow gid={gid} name="sun" cx={100} cy={120} r={90} color="#D9954B" opacity={0.4} />
    {Array.from({ length: 11 }).map((_, i) => {
      const a = Math.PI + ((i + 0.5) / 11) * Math.PI;
      return <Line key={i} x1={f(100 + Math.cos(a) * 30)} y1={f(120 + Math.sin(a) * 30)} x2={f(100 + Math.cos(a) * 92)} y2={f(120 + Math.sin(a) * 92)} stroke="#E2A45C" strokeOpacity={0.22} strokeWidth={1.4} strokeLinecap="round" />;
    })}
    <Circle cx={100} cy={120} r={26} fill="#E3A55E" opacity={0.9} />
    <Circle cx={100} cy={120} r={38} fill="none" stroke="#E3A55E" strokeOpacity={0.3} strokeWidth={1} />
  </>
);

const Calm: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0F1E28', '#1C3546', '#2E5068']} />
    <Glow gid={gid} name="moon" cx={58} cy={34} r={30} color="#CFE0EC" opacity={0.3} />
    <Circle cx={58} cy={34} r={8} fill="#E3ECF2" opacity={0.85} />
    <Path d={wavePath(78, 4, 1.2, 0.5)} fill="#1E3B4D" />
    <Path d={wavePath(92, 4, 1.6, 2.2)} fill="#162E3D" />
    <Path d={wavePath(106, 3, 2, 4.1)} fill="#10232F" />
  </>
);

const Rain: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0F151B', '#1A252F', '#2A3947']} />
    <G opacity={0.95}>
      <Ellipse cx={70} cy={26} rx={38} ry={14} fill="#3A4B5A" />
      <Ellipse cx={104} cy={20} rx={34} ry={15} fill="#425466" />
      <Ellipse cx={136} cy={28} rx={36} ry={13} fill="#37495A" />
      <Ellipse cx={100} cy={32} rx={62} ry={10} fill="#33444F" />
    </G>
    {Array.from({ length: 34 }).map((_, i) => {
      const x = rand() * W;
      const y = 40 + rand() * 60;
      const len = 6 + rand() * 8;
      return <Line key={i} x1={f(x)} y1={f(y)} x2={f(x - len * 0.25)} y2={f(y + len)} stroke="#A9C0D2" strokeOpacity={f(0.2 + rand() * 0.35)} strokeWidth={0.9} strokeLinecap="round" />;
    })}
    {[0, 1, 2].map((i) => (
      <Ellipse key={i} cx={40 + i * 60} cy={108 + (i % 2) * 4} rx={12 + i * 2} ry={2.6} fill="none" stroke="#A9C0D2" strokeOpacity={0.35} strokeWidth={0.8} />
    ))}
  </>
);

const Ocean: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0A1823', '#12303F', '#245068']} />
    <Glow gid={gid} name="moon" cx={140} cy={40} r={36} color="#D6E8F0" opacity={0.3} />
    <Circle cx={140} cy={40} r={9} fill="#E6F0F4" opacity={0.8} />
    <Path d={wavePath(66, 3.5, 2.2, 0.2)} fill="#1F4A60" />
    <Path d={wavePath(80, 4.5, 1.7, 1.9)} fill="#183C50" />
    <Path d={wavePath(96, 5, 1.4, 3.6)} fill="#112D3D" />
    <Path d={wavePath(110, 4, 1.9, 5.2)} fill="#0C2230" />
    <Path d={`M0 ${f(80)} ${Array.from({ length: 24 })
      .map((_, i) => `L${f((i / 23) * W)} ${f(80 + 4.5 * Math.sin((i / 23) * Math.PI * 2 * 1.7 + 1.9))}`)
      .join(' ')}`} fill="none" stroke="#D3E6EC" strokeOpacity={0.3} strokeWidth={0.9} />
  </>
);

const Forest: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0F1D17', '#1E3628', '#35513A']} />
    <Defs>
      <LinearGradient id={`${gid}beam`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#E8F0C8" stopOpacity={0.2} />
        <Stop offset="1" stopColor="#E8F0C8" stopOpacity={0} />
      </LinearGradient>
    </Defs>
    <Path d="M120 0 L150 0 L118 110 L84 110 Z" fill={`url(#${gid}beam)`} />
    <Path d="M158 0 L176 0 L160 110 L138 110 Z" fill={`url(#${gid}beam)`} opacity={0.7} />
    <Pines rand={rand} baseY={96} minH={26} maxH={48} step={12} color="#1C3527" />
    <Pines rand={rand} baseY={116} minH={34} maxH={62} step={16} color="#10241A" />
    <Path d="M52 30 q4 -5 8 0 q4 -5 8 0" fill="none" stroke="#DCE6D0" strokeOpacity={0.6} strokeWidth={1} strokeLinecap="round" />
    <Path d="M76 22 q3 -4 6 0 q3 -4 6 0" fill="none" stroke="#DCE6D0" strokeOpacity={0.45} strokeWidth={0.9} strokeLinecap="round" />
  </>
);

const Fire: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#130E0B', '#231610', '#332014']} />
    <Glow gid={gid} name="warm" cx={100} cy={86} r={70} color="#D9954B" opacity={0.36} />
    <Path d="M100 40 C112 58 122 66 118 84 C116 96 108 102 100 102 C92 102 84 96 82 84 C80 70 92 62 100 40 Z" fill="#D9954B" opacity={0.85} />
    <Path d="M100 58 C107 70 112 76 110 88 C109 96 105 100 100 100 C95 100 91 96 90 88 C89 78 96 72 100 58 Z" fill="#F0C27A" opacity={0.92} />
    <Path d="M100 78 C104 84 106 88 105 94 C104 98 102 100 100 100 C98 100 96 98 95 94 C94 88 97 84 100 78 Z" fill="#FFF0C8" opacity={0.85} />
    <Path d="M66 108 L134 98" stroke="#3A2A20" strokeWidth={6} strokeLinecap="round" />
    <Path d="M66 98 L134 108" stroke="#2E211A" strokeWidth={6} strokeLinecap="round" />
    {Array.from({ length: 9 }).map((_, i) => (
      <Circle key={i} cx={f(80 + rand() * 40)} cy={f(20 + rand() * 50)} r={f(0.5 + rand() * 0.7)} fill="#F0C27A" opacity={f(0.3 + rand() * 0.5)} />
    ))}
  </>
);

const Ambient: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#0A101B', '#111E2E', '#1B3044']} />
    <Stars rand={rand} count={22} maxY={60} />
    <Defs>
      {[
        ['a', '#5C7A94'],
        ['b', '#7A9B76'],
        ['c', '#8B7FA8'],
      ].map(([key, color]) => (
        <LinearGradient key={key} id={`${gid}band${key}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0} />
          <Stop offset="0.5" stopColor={color} stopOpacity={0.5} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      ))}
    </Defs>
    <Path d="M0 60 C40 20 70 90 110 50 C150 10 170 60 200 34 L200 86 C170 110 150 60 110 96 C70 130 40 66 0 106 Z" fill={`url(#${gid}banda)`} />
    <Path d="M0 40 C50 70 80 10 120 44 C160 76 180 30 200 50 L200 84 C180 64 160 110 120 80 C80 50 50 106 0 74 Z" fill={`url(#${gid}bandb)`} opacity={0.8} />
    <Path d="M0 84 C50 60 90 100 130 74 C160 54 180 84 200 70 L200 104 C180 118 160 90 130 104 C90 122 50 90 0 112 Z" fill={`url(#${gid}bandc)`} opacity={0.7} />
  </>
);

const Guided: React.FC<SceneProps> = ({ gid, rand }) => (
  <>
    <Sky gid={gid} colors={['#10171E', '#182430', '#223343']} />
    <Glow gid={gid} name="center" cx={100} cy={60} r={64} color="#7A97B0" opacity={0.2} />
    {Array.from({ length: 27 }).map((_, i) => {
      const x = 22 + i * 6.3;
      const envelope = Math.sin((i / 26) * Math.PI);
      const h = 6 + envelope * (18 + rand() * 30);
      return <Line key={i} x1={f(x)} y1={f(60 - h / 2)} x2={f(x)} y2={f(60 + h / 2)} stroke="#9DB7CC" strokeOpacity={f(0.35 + envelope * 0.45)} strokeWidth={2.4} strokeLinecap="round" />;
    })}
  </>
);

const Unguided: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0F1C24', '#1B3240', '#2C4D5E']} />
    <Glow gid={gid} name="sky" cx={100} cy={44} r={70} color="#CFE0EC" opacity={0.14} />
    <Rect x={0} y={90} width={W} height={30} fill="#152A36" />
    <Ellipse cx={100} cy={91} rx={70} ry={3} fill="#CFE0EC" opacity={0.1} />
    <Ellipse cx={100} cy={86} rx={22} ry={7} fill="#4A6072" />
    <Ellipse cx={100} cy={71} rx={16} ry={6} fill="#5B7386" />
    <Ellipse cx={100} cy={58} rx={10} ry={5} fill="#6E8799" />
    <Ellipse cx={100} cy={97} rx={20} ry={2.4} fill="#000000" opacity={0.25} />
  </>
);

const Breathing: React.FC<SceneProps> = ({ gid }) => (
  <>
    <Sky gid={gid} colors={['#0E1B1B', '#173033', '#234848']} />
    <Defs>
      <RadialGradient id={`${gid}breath`} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor="#9CD0CB" stopOpacity={0.5} />
        <Stop offset="1" stopColor="#9CD0CB" stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={100} cy={60} r={56} fill={`url(#${gid}breath)`} />
    {[16, 28, 42, 58].map((r, i) => (
      <Circle key={r} cx={100} cy={60} r={r} fill="none" stroke="#B5DDD8" strokeOpacity={0.55 - i * 0.12} strokeWidth={1.1} />
    ))}
    <Circle cx={100} cy={60} r={7} fill="#DDEFEC" opacity={0.85} />
  </>
);

const SCENES: Record<MeditationArtKind, React.FC<SceneProps>> = {
  sleep: Sleep,
  stress_relaxation: StressRelaxation,
  focus: Focus,
  nature: Nature,
  morning: Morning,
  mindfulness: Mindfulness,
  energy: Energy,
  calm: Calm,
  rain: Rain,
  ocean: Ocean,
  forest: Forest,
  fire: Fire,
  ambient: Ambient,
  guided: Guided,
  unguided: Unguided,
  breathing: Breathing,
};

interface MeditationArtProps {
  kind: MeditationArtKind;
  /** Varies the details of a scene (star positions, tree heights) so several items of one kind don't look identical. */
  seed?: string;
}

/**
 * Restrained, code-drawn scenery for Meditation content — one calm scene per
 * category/sound/practice, drawn to fill whatever box the parent gives it
 * (`slice` scaling, so it crops rather than distorts). Vector, so it needs no
 * image assets and stays sharp at every size; the palette stays inside
 * LongLivy's muted charcoal / sage / steel range rather than introducing loud
 * colors. Callers overlay their own scrim for text legibility.
 */
export const MeditationArt: React.FC<MeditationArtProps> = React.memo(({ kind, seed = kind }) => {
  const rawId = useId();
  const gid = useMemo(() => `a${rawId.replace(/[^a-zA-Z0-9]/g, '')}`, [rawId]);
  const Scene = SCENES[kind];
  // A generator is stateful, so every render starts a fresh one from the same
  // seed - the scene then draws identically each time it re-renders.
  const rand = seededRandom(`${kind}:${seed}`);
  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice">
      <Scene gid={gid} rand={rand} />
    </Svg>
  );
});
MeditationArt.displayName = 'MeditationArt';
