import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppIcon, AppIconName } from './AppIcon';
import { GlowOrb } from './GlowOrb';

interface AppProgressRingProps {
  progress: number; // 0..1, values >1 render as a full ring
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  /** Convenience center icon — an alternative to passing custom `children` for the common "icon only" case (e.g. FastingCard's small dashboard ring). Ignored if `children` is also provided. */
  icon?: AppIconName;
  iconSize?: number;
  iconColor?: string;
  /**
   * A soft glow behind the ring, tinted to its own color — off by default
   * so dashboard-embedded rings (already sitting inside a card among other
   * content) stay calm; turned on for the large, full-screen "hero" rings
   * (an active fast, a meditation session, today's calories) where a
   * little depth reads as premium rather than busy.
   */
  glow?: boolean;
}

/**
 * The app's one circular progress component — every "ring" in the app
 * (fasting, meditation, today's calories) renders through this. Defaults
 * are deliberately hardcoded hex/rgba rather than theme.colors.primary/
 * primaryMuted: the app's actual theme.mode still follows system light/
 * dark appearance, but every screen this renders on is a hardcoded dark
 * hero surface regardless — reading theme colors here would risk the same
 * "invisible on a dark card" bug already found and fixed elsewhere this
 * session (see AppBadge's tone="primary" in MethodCard). Every current
 * call site already passes its own explicit color/trackColor, so this
 * only changes what happens if a future usage omits them.
 */
export const AppProgressRing: React.FC<AppProgressRingProps> = React.memo(
  ({ progress, size = 220, strokeWidth = 16, color = '#4FAE8F', trackColor = 'rgba(255,255,255,0.12)', children, icon, iconSize, iconColor, glow = false }) => {
    const clamped = Math.max(0, Math.min(progress, 1));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - clamped);

    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        {glow ? <GlowOrb size={size * 1.35} color={color} opacity={0.16} pulse /> : null}
        <Svg width={size} height={size}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          {children ?? (icon ? <AppIcon name={icon} size={iconSize ?? Math.round(size * 0.3)} color={iconColor ?? color} /> : null)}
        </View>
      </View>
    );
  }
);

AppProgressRing.displayName = 'AppProgressRing';
