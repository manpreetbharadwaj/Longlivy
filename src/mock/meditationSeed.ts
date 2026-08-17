import { BreathingScheme, Meditation, MeditationSession } from '@/features/meditation/models';
import { DEMO_USER_ID } from './demoUser';

export const MEDITATION_CONTENT_SEED: Meditation[] = [
  { id: 'med_1', title: 'Morning Clarity', description: 'A gentle start to the day with a focus on intention-setting.', category: 'Morning', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_2', title: 'Deep Relaxation', description: 'Full-body relaxation to release physical tension.', category: 'Relaxation', type: 'guided', durationSeconds: 900, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_3', title: 'Stress Reset', description: 'A short guided session to help you reset during a stressful day.', category: 'Stress reduction', type: 'guided', durationSeconds: 300, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_4', title: 'Mindful Minutes', description: 'A brief mindfulness practice you can use anywhere.', category: 'Mindfulness', type: 'guided', durationSeconds: 180, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_5', title: 'Wind Down', description: 'A calming guided session to help you fall asleep.', category: 'Fall asleep', type: 'guided', durationSeconds: 1200, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_6', title: 'Focus Builder', description: 'Sharpen concentration before deep work.', category: 'Concentration', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_7', title: 'Body Scan', description: 'A slow, attentive scan through the body.', category: 'Body awareness', type: 'guided', durationSeconds: 900, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
  { id: 'med_8', title: 'Evening Unwind', description: 'Close the day with a calming reflection.', category: 'Evening', type: 'guided', durationSeconds: 600, language: 'en', status: 'published', version: '1.0', source: 'Longlivy Studio' },
];

export const BREATHING_SCHEMES_SEED: BreathingScheme[] = [
  { id: 'breath_box', name: 'Box Breathing', inhaleSeconds: 4, holdSeconds: 4, exhaleSeconds: 4, secondHoldSeconds: 4, repetitions: 8, description: 'Equal-length inhale, hold, exhale and hold. Often used for calm focus.' },
  { id: 'breath_478', name: '4-7-8 Breathing', inhaleSeconds: 4, holdSeconds: 7, exhaleSeconds: 8, secondHoldSeconds: 0, repetitions: 6, description: 'A longer exhale pattern some people use before sleep.' },
  { id: 'breath_calm', name: 'Calming Breath', inhaleSeconds: 4, holdSeconds: 0, exhaleSeconds: 6, secondHoldSeconds: 0, repetitions: 10, description: 'A simple longer-exhale pattern for relaxation.' },
];

function daysAgo(n: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const MEDITATION_SESSION_SEED: MeditationSession[] = Array.from({ length: 8 }).map((_, i) => {
  const start = daysAgo(i, 21);
  const durationSec = [600, 300, 900, 600, 180, 600, 300, 1200][i % 8];
  return {
    id: `med_session_seed_${i}`,
    userId: DEMO_USER_ID,
    meditationId: MEDITATION_CONTENT_SEED[i % MEDITATION_CONTENT_SEED.length].id,
    meditationTitle: MEDITATION_CONTENT_SEED[i % MEDITATION_CONTENT_SEED.length].title,
    type: 'guided',
    templateId: null,
    plannedDurationSeconds: durationSec,
    activeDurationSeconds: durationSec,
    pausedDurationSeconds: 0,
    startedAt: start,
    endedAt: start,
    status: 'completed',
    events: [],
    createdAt: start,
  } satisfies MeditationSession;
});
