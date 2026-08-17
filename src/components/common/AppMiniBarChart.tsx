import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from './AppText';

interface AppMiniBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

/**
 * A minimal day-by-day bar chart built from plain Views — no chart library
 * dependency. Bars scale relative to the max value in the series; an
 * all-zero series renders as flat baseline bars rather than crashing on a
 * divide-by-zero, which also keeps "no data yet" visually honest.
 */
export const AppMiniBarChart: React.FC<AppMiniBarChartProps> = React.memo(({ data, color, height = 64 }) => {
  const { theme } = useTheme();
  const tint = color ?? theme.colors.primary;
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.value)), [data]);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, marginTop: theme.spacing.xs }}>
      {data.map((d, idx) => (
        <View key={`${d.label}-${idx}`} style={{ flex: 1, alignItems: 'center', marginHorizontal: 2 }}>
          <View
            style={{
              width: '100%',
              maxWidth: 22,
              height: Math.max(3, (d.value / max) * (height - 16)),
              borderRadius: theme.radius.sm,
              backgroundColor: d.value > 0 ? tint : theme.colors.border,
            }}
          />
          <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginTop: 4 }}>
            {d.label}
          </AppText>
        </View>
      ))}
    </View>
  );
});

AppMiniBarChart.displayName = 'AppMiniBarChart';
