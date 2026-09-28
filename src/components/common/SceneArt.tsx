import React from 'react';
import { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

/** Shared drawing kit for the app's scenic artwork (Meditation, Activity): a 200x120 canvas, gradient skies, soft glows, ridgelines, trees - all vector, all in the muted palette. */
export const W = 200;
export const H = 120;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const f = (n: number) => Math.round(n * 10) / 10;

/** A closed silhouette from x=0..W: a smooth ridge at `y` ± `amp`, filled down to the bottom edge. */
export function ridgePath(y: number, amp: number, freq: number, phase: number): string {
  const steps = 40;
  let d = `M0 ${H}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    const yy = y - amp * (0.5 + 0.5 * Math.sin((x / W) * Math.PI * 2 * freq + phase));
    d += ` L${f(x)} ${f(yy)}`;
  }
  return `${d} L${W} ${H} Z`;
}

export function wavePath(y: number, amp: number, freq: number, phase: number): string {
  const steps = 48;
  let d = `M0 ${H}`;
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * W;
    d += ` L${f(x)} ${f(y + amp * Math.sin((x / W) * Math.PI * 2 * freq + phase))}`;
  }
  return `${d} L${W} ${H} Z`;
}

export interface SceneProps {
  gid: string;
  rand: () => number;
}

export const Sky: React.FC<{ gid: string; colors: string[] }> = ({ gid, colors }) => (
  <>
    <Defs>
      <LinearGradient id={`${gid}sky`} x1="0" y1="0" x2="0" y2="1">
        {colors.map((color, i) => (
          <Stop key={i} offset={i / (colors.length - 1)} stopColor={color} />
        ))}
      </LinearGradient>
    </Defs>
    <Rect x={0} y={0} width={W} height={H} fill={`url(#${gid}sky)`} />
  </>
);

export const Glow: React.FC<{ gid: string; name: string; cx: number; cy: number; r: number; color: string; opacity: number }> = ({ gid, name, cx, cy, r, color, opacity }) => (
  <>
    <Defs>
      <RadialGradient id={`${gid}${name}`} cx="50%" cy="50%" r="50%">
        <Stop offset="0" stopColor={color} stopOpacity={opacity} />
        <Stop offset="1" stopColor={color} stopOpacity={0} />
      </RadialGradient>
    </Defs>
    <Circle cx={cx} cy={cy} r={r} fill={`url(#${gid}${name})`} />
  </>
);

export const Stars: React.FC<{ rand: () => number; count: number; maxY?: number }> = ({ rand, count, maxY = 70 }) => (
  <G>
    {Array.from({ length: count }).map((_, i) => (
      <Circle key={i} cx={f(rand() * W)} cy={f(rand() * maxY)} r={f(0.4 + rand() * 0.8)} fill="#EDEBE4" opacity={f(0.25 + rand() * 0.55)} />
    ))}
  </G>
);

export const Pines: React.FC<{ rand: () => number; baseY: number; minH: number; maxH: number; step: number; color: string; opacity?: number }> = ({ rand, baseY, minH, maxH, step, color, opacity = 1 }) => {
  const trees: React.ReactNode[] = [];
  for (let x = -4; x < W + 6; x += step) {
    const cx = x + rand() * step * 0.6;
    const h = minH + rand() * (maxH - minH);
    const w = h * 0.28;
    trees.push(<Path key={x} d={`M${f(cx - w)} ${baseY} L${f(cx)} ${f(baseY - h)} L${f(cx + w)} ${baseY} Z`} fill={color} opacity={opacity} />);
  }
  return <G>{trees}</G>;
};

