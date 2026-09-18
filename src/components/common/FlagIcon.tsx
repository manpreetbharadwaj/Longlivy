import React from 'react';
import Svg, { Rect, Circle, Path, Polygon, Line, G, Defs, ClipPath } from 'react-native-svg';

/**
 * Local, dependency-free flag icons — one SVG per supported country,
 * rendered through `react-native-svg` (already a project dependency, no
 * new native linking). Built to replace flag *emoji*: regional-indicator
 * emoji sequences render inconsistently across platforms — Android's
 * system emoji font has historically omitted flag glyphs entirely on many
 * OEM skins/versions (they fall back to the two-letter ISO code in a box,
 * or nothing), and even iOS can come up short on a simulator/device
 * missing its color-emoji font asset (observed directly during testing:
 * `AppleColorEmoji.ttc` absent on one simulator runtime). An SVG shape
 * rendered by the app itself has no such dependency — it looks the same
 * everywhere the app runs.
 *
 * Deliberately simplified, not pixel-accurate reproductions (no 50-star
 * US canton, no Ashoka Chakra spoke count, no taegeuk trigrams) — at the
 * ~20-28px size these render in a picker row, fine detail is invisible
 * anyway; what matters is correct proportions and colors so each flag
 * reads as itself at a glance.
 */

const VIEW_W = 30;
const VIEW_H = 20;

/** 5-pointed star polygon, points computed rather than hand-typed. */
function starPoints(cx: number, cy: number, rOuter: number, rInner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    // -90° so the star points straight up.
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(' ');
}

type FlagRenderer = () => React.ReactElement;

const FLAGS: Record<string, FlagRenderer> = {
  US: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#FFFFFF" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <Rect key={i} x={0} y={(i * VIEW_H) / 13} width={VIEW_W} height={VIEW_H / 13} fill="#B22234" />
      ))}
      <Rect x={0} y={0} width={VIEW_W * 0.42} height={(VIEW_H * 7) / 13} fill="#3C3B6E" />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <Circle key={`${row}-${col}`} cx={1.8 + col * 2.9} cy={1.8 + row * 3.1} r={0.55} fill="#FFFFFF" />
        ))
      )}
    </>
  ),
  DE: () => (
    <>
      <Rect y={0} width={VIEW_W} height={VIEW_H / 3} fill="#000000" />
      <Rect y={VIEW_H / 3} width={VIEW_W} height={VIEW_H / 3} fill="#DD0000" />
      <Rect y={(2 * VIEW_H) / 3} width={VIEW_W} height={VIEW_H / 3} fill="#FFCE00" />
    </>
  ),
  ES: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#AA151B" />
      <Rect y={VIEW_H / 4} width={VIEW_W} height={VIEW_H / 2} fill="#F1BF00" />
    </>
  ),
  FR: () => (
    <>
      <Rect width={VIEW_W / 3} height={VIEW_H} fill="#0055A4" />
      <Rect x={VIEW_W / 3} width={VIEW_W / 3} height={VIEW_H} fill="#FFFFFF" />
      <Rect x={(2 * VIEW_W) / 3} width={VIEW_W / 3} height={VIEW_H} fill="#EF4135" />
    </>
  ),
  PT: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#FF0000" />
      <Rect width={VIEW_W * 0.4} height={VIEW_H} fill="#046A38" />
      <Circle cx={VIEW_W * 0.4} cy={VIEW_H / 2} r={3.2} fill="#FFCC00" stroke="#FFFFFF" strokeWidth={0.4} />
    </>
  ),
  IT: () => (
    <>
      <Rect width={VIEW_W / 3} height={VIEW_H} fill="#009246" />
      <Rect x={VIEW_W / 3} width={VIEW_W / 3} height={VIEW_H} fill="#FFFFFF" />
      <Rect x={(2 * VIEW_W) / 3} width={VIEW_W / 3} height={VIEW_H} fill="#CE2B37" />
    </>
  ),
  NL: () => (
    <>
      <Rect y={0} width={VIEW_W} height={VIEW_H / 3} fill="#AE1C28" />
      <Rect y={VIEW_H / 3} width={VIEW_W} height={VIEW_H / 3} fill="#FFFFFF" />
      <Rect y={(2 * VIEW_H) / 3} width={VIEW_W} height={VIEW_H / 3} fill="#21468B" />
    </>
  ),
  PL: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H / 2} fill="#FFFFFF" />
      <Rect y={VIEW_H / 2} width={VIEW_W} height={VIEW_H / 2} fill="#DC143C" />
    </>
  ),
  TR: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#E30A17" />
      <Circle cx={12.5} cy={10} r={5} fill="#FFFFFF" />
      <Circle cx={14} cy={10} r={4.2} fill="#E30A17" />
      <Polygon points={starPoints(18.5, 10, 1.8, 0.75)} fill="#FFFFFF" />
    </>
  ),
  RU: () => (
    <>
      <Rect y={0} width={VIEW_W} height={VIEW_H / 3} fill="#FFFFFF" />
      <Rect y={VIEW_H / 3} width={VIEW_W} height={VIEW_H / 3} fill="#0039A6" />
      <Rect y={(2 * VIEW_H) / 3} width={VIEW_W} height={VIEW_H / 3} fill="#D52B1E" />
    </>
  ),
  SA: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#006C35" />
      <Rect x={7} y={13.2} width={16} height={1.1} rx={0.55} fill="#FFFFFF" />
      <Rect x={21.5} y={11.8} width={4.2} height={1} rx={0.5} transform="rotate(-28 21.5 11.8)" fill="#FFFFFF" />
    </>
  ),
  IN: () => (
    <>
      <Rect y={0} width={VIEW_W} height={VIEW_H / 3} fill="#FF9933" />
      <Rect y={VIEW_H / 3} width={VIEW_W} height={VIEW_H / 3} fill="#FFFFFF" />
      <Rect y={(2 * VIEW_H) / 3} width={VIEW_W} height={VIEW_H / 3} fill="#138808" />
      <Circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={2.1} fill="none" stroke="#000080" strokeWidth={0.35} />
      <Circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={0.4} fill="#000080" />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (Math.PI / 4) * i;
        const x2 = VIEW_W / 2 + 2.1 * Math.cos(angle);
        const y2 = VIEW_H / 2 + 2.1 * Math.sin(angle);
        return <Line key={i} x1={VIEW_W / 2} y1={VIEW_H / 2} x2={x2} y2={y2} stroke="#000080" strokeWidth={0.25} />;
      })}
    </>
  ),
  BD: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#006A4E" />
      <Circle cx={13} cy={10} r={5} fill="#F42A41" />
    </>
  ),
  PK: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#01411C" />
      <Rect width={VIEW_W * 0.22} height={VIEW_H} fill="#FFFFFF" />
      <Circle cx={19} cy={10} r={4.6} fill="#FFFFFF" />
      <Circle cx={20.3} cy={10} r={3.9} fill="#01411C" />
      <Polygon points={starPoints(23.2, 7.2, 1.6, 0.65)} fill="#FFFFFF" />
    </>
  ),
  CN: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#DE2910" />
      <Polygon points={starPoints(7, 6, 2.4, 0.95)} fill="#FFDE00" />
      <Polygon points={starPoints(13, 3, 0.8, 0.32)} fill="#FFDE00" />
      <Polygon points={starPoints(14.6, 5.6, 0.8, 0.32)} fill="#FFDE00" />
      <Polygon points={starPoints(14.6, 8.8, 0.8, 0.32)} fill="#FFDE00" />
      <Polygon points={starPoints(13, 11.2, 0.8, 0.32)} fill="#FFDE00" />
    </>
  ),
  JP: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#FFFFFF" />
      <Circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={5.3} fill="#BC002D" />
    </>
  ),
  KR: () => (
    <G>
      <Rect width={VIEW_W} height={VIEW_H} fill="#FFFFFF" />
      <Path d="M 15 4.5 A 5.5 5.5 0 0 1 15 15.5 A 2.75 2.75 0 0 1 15 10 A 2.75 2.75 0 0 0 15 4.5 Z" fill="#CD2E3A" />
      <Path d="M 15 4.5 A 5.5 5.5 0 0 0 15 15.5 A 2.75 2.75 0 0 0 15 10 A 2.75 2.75 0 0 1 15 4.5 Z" fill="#0047A0" />
    </G>
  ),
  ID: () => (
    <>
      <Rect y={0} width={VIEW_W} height={VIEW_H / 2} fill="#FF0000" />
      <Rect y={VIEW_H / 2} width={VIEW_W} height={VIEW_H / 2} fill="#FFFFFF" />
    </>
  ),
  VN: () => (
    <>
      <Rect width={VIEW_W} height={VIEW_H} fill="#DA251D" />
      <Polygon points={starPoints(VIEW_W / 2, VIEW_H / 2, 5.2, 2.05)} fill="#FFFF00" />
    </>
  ),
  TH: () => {
    const band = VIEW_H / 6;
    return (
      <>
        <Rect y={0} width={VIEW_W} height={band} fill="#A51931" />
        <Rect y={band} width={VIEW_W} height={band} fill="#F4F5F8" />
        <Rect y={band * 2} width={VIEW_W} height={band * 2} fill="#2D2A4A" />
        <Rect y={band * 4} width={VIEW_W} height={band} fill="#F4F5F8" />
        <Rect y={band * 5} width={VIEW_W} height={band} fill="#A51931" />
      </>
    );
  },
};

interface FlagIconProps {
  /** ISO 3166-1 alpha-2 country code — see `LanguageDefinition.countryCode` in `@/config/languages`. */
  countryCode: string;
  /** Rendered width in px; height follows the flag's fixed aspect ratio (3:2). */
  size?: number;
  style?: object;
}

/** Neutral placeholder for a country code with no flag defined — a plain rounded tile rather than a blank gap. */
const Fallback: React.FC = () => (
  <>
    <Rect width={VIEW_W} height={VIEW_H} rx={2} fill="#2A3742" />
    <Circle cx={VIEW_W / 2} cy={VIEW_H / 2} r={4.5} fill="none" stroke="#6B7D87" strokeWidth={0.8} />
  </>
);

export const FlagIcon: React.FC<FlagIconProps> = React.memo(({ countryCode, size = 24, style }) => {
  const Renderer = FLAGS[countryCode.toUpperCase()];
  const height = (size * VIEW_H) / VIEW_W;
  return (
    <Svg width={size} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={style}>
      <Defs>
        <ClipPath id="roundedEdge">
          <Rect width={VIEW_W} height={VIEW_H} rx={2} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#roundedEdge)">{Renderer ? <Renderer /> : <Fallback />}</G>
    </Svg>
  );
});
FlagIcon.displayName = 'FlagIcon';
