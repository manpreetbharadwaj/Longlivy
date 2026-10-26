import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppSegmentedControl } from '@/components/common/AppSegmentedControl';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { useTheme } from '@/hooks/useTheme';
import {
  DEFAULT_VOICE_COACH_SETTINGS,
  VoiceCoachSettings,
  DistanceAnnouncementInterval,
  TimeAnnouncementInterval,
  readVoiceCoachSettings,
  writeVoiceCoachSettings,
  listInstalledLanguages,
  speakTestAnnouncement,
} from '../services/VoiceCoach';

const DISTANCE_OPTIONS: DistanceAnnouncementInterval[] = [0.5, 1, 2, 5];
const TIME_OPTIONS: TimeAnnouncementInterval[] = ['off', 5, 10, 15, 30];

/**
 * Compact Voice Coaching panel for the existing Settings screen — reads and
 * writes the same `VoiceCoachSettings` the background workout tracking task
 * reads on every GPS update (see VoiceCoach.ts), so a change here takes
 * effect on the very next milestone check, including mid-workout.
 */
export const VoiceCoachingSettings: React.FC = () => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<VoiceCoachSettings>(DEFAULT_VOICE_COACH_SETTINGS);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    readVoiceCoachSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
    listInstalledLanguages().then(setLanguages);
  }, []);

  const update = useCallback((patch: Partial<VoiceCoachSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeVoiceCoachSettings(next).catch(() => undefined);
      return next;
    });
  }, []);

  if (!loaded) return null;

  const languageSegments = [
    { key: 'device', label: 'Device default' },
    ...languages.slice(0, 3).map((lang) => ({ key: lang, label: lang })),
  ];

  return (
    <HeroCard style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <AppText variant="bodyMedium" color="#FFFFFF">
          Voice coaching
        </AppText>
        <AppSwitch variant="hero" value={settings.enabled} onValueChange={(enabled) => update({ enabled })} accessibilityLabel="Voice coaching" />
      </View>

      {settings.enabled ? (
        <>
          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginBottom: 4 }}>
            ANNOUNCE EVERY
          </AppText>
          <AppSegmentedControl
            variant="hero"
            segments={DISTANCE_OPTIONS.map((km) => ({ key: String(km), label: `${km} km` }))}
            selectedKey={String(settings.distanceIntervalKm)}
            onChange={(key) => update({ distanceIntervalKm: Number(key) as DistanceAnnouncementInterval })}
          />

          <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginTop: theme.spacing.sm, marginBottom: 4 }}>
            TIME MILESTONE
          </AppText>
          <AppSegmentedControl
            variant="hero"
            segments={TIME_OPTIONS.map((min) => ({ key: String(min), label: min === 'off' ? 'Off' : `${min} min` }))}
            selectedKey={String(settings.timeIntervalMinutes)}
            onChange={(key) => update({ timeIntervalMinutes: (key === 'off' ? 'off' : Number(key)) as TimeAnnouncementInterval })}
          />

          {languageSegments.length > 1 ? (
            <>
              <AppText variant="caption" color="rgba(255,255,255,0.55)" style={{ marginTop: theme.spacing.sm, marginBottom: 4 }}>
                VOICE LANGUAGE
              </AppText>
              <AppSegmentedControl
                variant="hero"
                segments={languageSegments}
                selectedKey={settings.language ?? 'device'}
                onChange={(key) => update({ language: key === 'device' ? null : key })}
              />
            </>
          ) : null}

          <AppGradientButton
            label="Test voice"
            onPress={() => speakTestAnnouncement(settings)}
            style={{ marginTop: theme.spacing.md }}
          />
        </>
      ) : null}
    </HeroCard>
  );
};
