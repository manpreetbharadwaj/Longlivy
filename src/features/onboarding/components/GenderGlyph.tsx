import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface GenderGlyphProps {
  kind: 'female' | 'male' | 'diverse';
  size?: number;
  color?: string;
}

/**
 * Minimal line-art silhouettes (Venus / Mars / a merged "diverse" glyph)
 * instead of a generic person icon — Ionicons has no gender symbols, and a
 * custom-drawn glyph reads as considerably more premium than a stock icon
 * on a selection card this size.
 */
export const GenderGlyph: React.FC<GenderGlyphProps> = ({ kind, size = 32, color = '#FFFFFF' }) => {
  const s = size;
  const stroke = Math.max(1.5, s / 16);

  if (kind === 'female') {
    // Venus: circle above, cross below.
    const r = s * 0.28;
    const cx = s / 2;
    const cy = s * 0.32;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        <Line x1={cx} y1={cy + r} x2={cx} y2={s * 0.94} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        <Line x1={cx - r * 0.7} y1={s * 0.78} x2={cx + r * 0.7} y2={s * 0.78} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      </Svg>
    );
  }

  if (kind === 'male') {
    // Mars: circle lower-left, arrow upper-right.
    const r = s * 0.28;
    const cx = s * 0.42;
    const cy = s * 0.62;
    return (
      <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
        <Circle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={stroke} fill="none" />
        <Line x1={cx + r * 0.66} y1={cy - r * 0.66} x2={s * 0.86} y2={s * 0.14} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        <Line x1={s * 0.62} y1={s * 0.14} x2={s * 0.86} y2={s * 0.14} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
        <Line x1={s * 0.86} y1={s * 0.14} x2={s * 0.86} y2={s * 0.38} stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      </Svg>
    );
  }

  // Diverse: overlapping rings — no single symbol implies exclusion.
  const r = s * 0.24;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={s * 0.4} cy={s * 0.5} r={r} stroke={color} strokeWidth={stroke} fill="none" />
      <Circle cx={s * 0.6} cy={s * 0.5} r={r} stroke={color} strokeWidth={stroke} fill="none" opacity={0.6} />
    </Svg>
  );
};
