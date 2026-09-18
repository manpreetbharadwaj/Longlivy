import React from 'react';
import Svg, { G, Circle, Ellipse, Path, Line, Polyline } from 'react-native-svg';

export interface AvatarArtProps {
  /** Rendered width & height in px. Artwork is authored in a 100×100 viewBox and scales cleanly (and without distortion) to any size. */
  size: number;
}

export type AvatarArt = React.FC<AvatarArtProps>;

/**
 * Every preset avatar here is original vector art authored for this product and
 * drawn from `react-native-svg` primitives at runtime — no bitmap files, no
 * external downloads, no third-party icon packs — so nothing in this set
 * carries a licensing constraint (see ./README.md).
 *
 * Shared visual system so the set reads as one family:
 *  - 100×100 viewBox, motif kept within an ~18–82 inset
 *  - a two-tone dark "disc" (steel top-light over near-black) matching the
 *    app's dark hero surfaces and blue/steel accent
 *  - one ink tone for primary shapes, one steel accent for support
 *  - consistent 6-unit rounded strokes
 */
const DISC_BASE = '#17181B';
const DISC_LIGHT = '#2A2F37';
const INK = '#F2F1EE';
const ACCENT = '#67E8F9';
const ACCENT_SOFT = 'rgba(122,151,176,0.22)';
const PETAL_SOFT = 'rgba(242,241,238,0.14)';
const STROKE = 6;

const strokeProps = {
  stroke: INK,
  strokeWidth: STROKE,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none' as const,
};

const shapeProps = {
  fill: ACCENT_SOFT,
  stroke: INK,
  strokeWidth: STROKE,
  strokeLinejoin: 'round' as const,
};

/** The dark disc every preset sits on — a flat base plus an offset light circle faking a soft top light. */
const Disc: React.FC = () => (
  <G>
    <Circle cx={50} cy={50} r={50} fill={DISC_BASE} />
    <Circle cx={50} cy={24} r={44} fill={DISC_LIGHT} opacity={0.4} />
  </G>
);

const Canvas: React.FC<AvatarArtProps & { children: React.ReactNode }> = ({ size, children }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Disc />
    {children}
  </Svg>
);

/** Growth / longevity — a stem with two unfurling leaves. */
export const SproutAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Path d="M50 80 C 50 66, 50 56, 50 44" {...strokeProps} />
    <Path d="M50 54 C 40 42, 26 44, 26 56 C 38 62, 50 60, 50 54 Z" {...shapeProps} />
    <Path d="M50 46 C 60 34, 74 36, 74 48 C 62 54, 50 52, 50 46 Z" {...shapeProps} />
  </Canvas>
);

/** Nature-inspired wellness — a single rounded leaf with veins. */
export const LeafAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Path d="M50 20 C 30 36, 30 64, 50 82 C 70 64, 70 36, 50 20 Z" {...shapeProps} />
    <Path d="M50 28 L 50 76" {...strokeProps} />
    <Path d="M50 44 L 38 38 M50 56 L 62 50" {...strokeProps} />
  </Canvas>
);

/** Mindfulness — a seated figure: head over a folded lap. */
export const MeditationAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Circle cx={50} cy={34} r={10} fill={INK} />
    <Path d="M50 48 C 33 50, 22 66, 24 74 C 40 78, 60 78, 76 74 C 78 66, 67 50, 50 48 Z" {...shapeProps} />
  </Canvas>
);

/** Balance — a cairn of three balanced stones. */
export const BalanceAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Ellipse cx={50} cy={70} rx={22} ry={9} fill={ACCENT_SOFT} stroke={INK} strokeWidth={STROKE} />
    <Ellipse cx={50} cy={53} rx={16} ry={8} fill={INK} />
    <Ellipse cx={50} cy={38} rx={11} ry={7} fill={ACCENT_SOFT} stroke={INK} strokeWidth={STROKE} />
  </Canvas>
);

/** Healthy lifestyle / vitality — a rising sun over a horizon. */
export const SunriseAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Line x1={20} y1={66} x2={80} y2={66} {...strokeProps} />
    <Path d="M34 66 A 16 16 0 0 1 66 66 Z" {...shapeProps} />
    <Line x1={50} y1={28} x2={50} y2={38} {...strokeProps} />
    <Line x1={27} y1={39} x2={33} y2={45} {...strokeProps} />
    <Line x1={73} y1={39} x2={67} y2={45} {...strokeProps} />
  </Canvas>
);

/** Nutrition / hydration — a water droplet with an inner highlight. */
export const HydrationAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Path d="M50 20 C 42 38, 30 50, 30 62 A 20 20 0 0 0 70 62 C 70 50, 58 38, 50 20 Z" {...shapeProps} />
    <Path d="M40 64 A 12 12 0 0 0 52 76" stroke={INK} strokeWidth={STROKE} strokeLinecap="round" fill="none" opacity={0.75} />
  </Canvas>
);

/** Health — a heartbeat trace inside a soft ring. */
export const PulseAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Circle cx={50} cy={50} r={30} stroke={ACCENT} strokeWidth={4} fill="none" opacity={0.5} />
    <Polyline points="24,52 38,52 44,36 52,66 58,46 64,52 76,52" {...strokeProps} />
  </Canvas>
);

/** Activity / achievement — twin peaks under a small sun. */
export const MountainAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Circle cx={66} cy={34} r={6} fill={ACCENT} />
    <Path d="M18 74 L 40 40 L 52 56 L 62 44 L 82 74 Z" {...shapeProps} />
    <Path d="M34 48 L 40 40 L 46 48 Z" fill={INK} />
  </Canvas>
);

/** Longevity science / energy — an electron on an orbit around a nucleus. */
export const OrbitAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Ellipse cx={50} cy={50} rx={28} ry={13} stroke={ACCENT} strokeWidth={4} fill="none" transform="rotate(-24 50 50)" />
    <Circle cx={50} cy={50} r={8} fill={INK} />
    <Circle cx={74} cy={39} r={5} fill={ACCENT} />
  </Canvas>
);

/** Subtle human silhouette — a minimal head-and-shoulders bust. */
export const SilhouetteAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <Circle cx={50} cy={50} r={40} stroke={ACCENT} strokeWidth={4} fill="none" opacity={0.45} />
    <Circle cx={50} cy={42} r={13} fill={INK} />
    <Path d="M24 80 C 24 62, 36 54, 50 54 C 64 54, 76 62, 76 80 Z" fill={INK} />
  </Canvas>
);

/** Abstract organic shape — a radial bloom of petals. */
export const BloomAvatar: AvatarArt = ({ size }) => (
  <Canvas size={size}>
    <G>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <Ellipse
          key={angle}
          cx={50}
          cy={32}
          rx={7}
          ry={16}
          transform={`rotate(${angle} 50 50)`}
          fill={i % 2 === 0 ? ACCENT_SOFT : PETAL_SOFT}
          stroke={INK}
          strokeWidth={STROKE - 1}
          strokeLinejoin="round"
        />
      ))}
    </G>
    <Circle cx={50} cy={50} r={7} fill={ACCENT} />
  </Canvas>
);
