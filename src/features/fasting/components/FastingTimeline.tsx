import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { TIMELINE_PHASES } from '../fastingTimelineContent';

interface FastingTimelineProps {
  elapsedHours: number;
}

/**
 * The redesigned fasting timeline — grouped into broad phases (each with
 * its own color and hour range) rather than one flat list, with several
 * milestones per phase instead of a single point every ~4 hours. See
 * fastingTimelineContent.ts for why the language stays hedged throughout.
 */
export const FastingTimeline: React.FC<FastingTimelineProps> = React.memo(({ elapsedHours }) => {
  const { theme } = useTheme();

  return (
    <View>
      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xxs }}>
        What can happen during your fast
      </AppText>
      <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginBottom: theme.spacing.md }}>
        General, educational information — not a live measurement of your body. Individual timing varies and isn't scientifically pin-pointable.
      </AppText>

      {TIMELINE_PHASES.map((phase, phaseIndex) => {
        const phaseReached = elapsedHours >= phase.milestones[0].hours;
        return (
          <View key={phase.key} style={{ marginBottom: theme.spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: phase.color, marginRight: theme.spacing.xxs, opacity: phaseReached ? 1 : 0.4 }} />
              <AppText variant="label" color={phaseReached ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>
                {phase.label.toUpperCase()}
              </AppText>
              <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginLeft: theme.spacing.xxs }}>
                {phase.rangeLabel}
              </AppText>
            </View>

            {phase.milestones.map((point, index) => {
              const reached = elapsedHours >= point.hours;
              const isLastOverall = phaseIndex === TIMELINE_PHASES.length - 1 && index === phase.milestones.length - 1;
              return (
                <View key={point.title} style={{ flexDirection: 'row' }}>
                  <View style={{ alignItems: 'center', marginRight: theme.spacing.sm }}>
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: reached ? phase.color : 'rgba(255,255,255,0.15)',
                        borderWidth: reached ? 0 : 1,
                        borderColor: 'rgba(255,255,255,0.25)',
                      }}
                    />
                    {isLastOverall ? null : <View style={{ width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 2 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: theme.spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <AppText variant="bodyMedium" color={reached ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}>
                        {point.title}
                      </AppText>
                      {reached ? (
                        <View style={{ marginLeft: 6 }}>
                          <AppIcon name="checkmark-circle" size={14} color={phase.color} />
                        </View>
                      ) : null}
                    </View>
                    <AppText variant="caption" color="rgba(255,255,255,0.4)" style={{ marginBottom: 2 }}>
                      ~{point.hours}h
                    </AppText>
                    <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                      {point.description}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
});

FastingTimeline.displayName = 'FastingTimeline';
