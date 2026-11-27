import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface FastingScheduleDialProps {
  /** Hours fasting and eating in one cycle — expected to add up to 24 (a daily or custom split); see `SelectFastingMethodScreen`, which only renders this for those categories. */
  fastingHours: number;
  eatingHours: number;
  size?: number;
  strokeWidth?: number;
  fastingColor?: string;
  eatingColor?: string;
  trackColor?: string;
}

/** The small gap drawn between the two arcs (in px of arc length), so the split reads as two segments rather than one ring that merely changes color. */
const GAP = 4;

/**
 * A 24-hour dial split into a fasting arc and an eating arc — the "quickly
 * see the fasting/eating split" visual the method picker needs. Two
 * `Circle`s sharing one `strokeDasharray`/`strokeDashoffset` trick (the same
 * technique `AppProgressRing` uses for a single arc), not a reusable ring
 * primitive, since a dual-arc split is specific to this one schedule view.
 */
export const FastingScheduleDial: React.FC<FastingScheduleDialProps> = React.memo(
  ({ fastingHours, eatingHours, size = 96, strokeWidth = 10, fastingColor = '#8B7FA8', eatingColor = '#7FA88B', trackColor = 'rgba(255,255,255,0.08)' }) => {
    const total = fastingHours + eatingHours;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const fastingLength = total > 0 ? circumference * (fastingHours / total) : 0;
    const eatingLength = total > 0 ? circumference * (eatingHours / total) : 0;
    const center = size / 2;
    const rotation = -90;

    return (
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {fastingHours > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={fastingColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(fastingLength - GAP, 0)} ${circumference}`}
            strokeDashoffset={-GAP / 2}
            strokeLinecap="round"
            fill="none"
            rotation={rotation}
            originX={center}
            originY={center}
          />
        ) : null}
        {eatingHours > 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={eatingColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${Math.max(eatingLength - GAP, 0)} ${circumference}`}
            strokeDashoffset={-(fastingLength + GAP / 2)}
            strokeLinecap="round"
            fill="none"
            rotation={rotation}
            originX={center}
            originY={center}
          />
        ) : null}
      </Svg>
    );
  }
);
FastingScheduleDial.displayName = 'FastingScheduleDial';
