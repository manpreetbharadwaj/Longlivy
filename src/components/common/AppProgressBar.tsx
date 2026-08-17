import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface AppProgressBarProps {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
}

export const AppProgressBar: React.FC<AppProgressBarProps> = React.memo(
  ({ progress, color, trackColor, height = 8 }) => {
    const { theme } = useTheme();
    const clamped = Math.max(0, Math.min(progress, 1));
    return (
      <View
        style={{
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor ?? theme.colors.primaryMuted,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${clamped * 100}%`,
            height: '100%',
            backgroundColor: color ?? theme.colors.primary,
            borderRadius: height / 2,
          }}
        />
      </View>
    );
  }
);

AppProgressBar.displayName = 'AppProgressBar';
