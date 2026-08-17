import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { useTheme } from '@/hooks/useTheme';

interface TimelinePoint {
  hours: number;
  title: string;
  description: string;
}

/**
 * Deliberately vague on timing language ("can begin", "typically", "varies
 * between people") — never asserts an exact biological moment.
 */
const TIMELINE_POINTS: TimelinePoint[] = [
  { hours: 0, title: 'Fasting started', description: 'Your eating window has closed for this session.' },
  { hours: 4, title: 'Energy supply is changing', description: 'The body typically starts shifting how it sources energy, depending on your last meal.' },
  { hours: 8, title: 'Insulin levels change', description: 'Insulin levels can begin to decline in many people, though the exact course varies.' },
  { hours: 12, title: 'Glycogen stores are used', description: 'Glycogen stores are typically drawn down further, depending on diet, activity and individual factors.' },
  { hours: 16, title: 'Fat metabolism gains importance', description: 'Fat metabolism can become more prominent in some people — this is not precisely measurable from time alone.' },
  { hours: 20, title: 'Ketone bodies can rise', description: 'Ketone bodies may begin to rise in some people; the exact manifestation varies between individuals.' },
  { hours: 24, title: 'Extended fasting territory', description: 'Longer fasting periods involve more pronounced individual variation — see the safety notice.' },
];

interface FastingTimelineProps {
  elapsedHours: number;
}

export const FastingTimeline: React.FC<FastingTimelineProps> = React.memo(({ elapsedHours }) => {
  const { theme } = useTheme();
  const points = useMemo(() => TIMELINE_POINTS, []);

  return (
    <View>
      <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
        What can happen during your fast
      </AppText>
      <AppText variant="caption" color={theme.colors.textTertiary} style={{ marginBottom: theme.spacing.sm }}>
        General, educational information — not a live measurement of your body. Individual timing varies
        and is scientifically not pin-pointable.
      </AppText>
      {points.map((point, index) => {
        const reached = elapsedHours >= point.hours;
        return (
          <View key={point.title} style={{ flexDirection: 'row', marginBottom: theme.spacing.sm }}>
            <View style={{ alignItems: 'center', marginRight: theme.spacing.sm }}>
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: reached ? theme.colors.fasting : theme.colors.border,
                }}
              />
              {index < points.length - 1 ? (
                <View style={{ width: 2, flex: 1, backgroundColor: theme.colors.border, marginTop: 2 }} />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: theme.spacing.xs }}>
              <AppText variant="bodyMedium" color={reached ? theme.colors.textPrimary : theme.colors.textTertiary}>
                {point.title} · ~{point.hours}h
              </AppText>
              <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                {point.description}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
});

FastingTimeline.displayName = 'FastingTimeline';
