export type FastingCategory = 'intermittent' | 'longer' | 'individual';

export type FastingMethodId =
  | '14:10'
  | '16:8'
  | '18:6'
  | '20:4'
  | '24h'
  | '36h'
  | '48h'
  | '72h'
  | '96h'
  | 'individual';

export type FastingStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'ended_prematurely'
  | 'extended'
  | 'cancelled';

export interface FastingMethodDefinition {
  id: FastingMethodId;
  name: string;
  category: FastingCategory;
  fastingHours: number;
  eatingHours: number;
  shortExplanation: string;
  recommendation?: string;
}

export interface FastingPlan {
  id: string;
  userId: string;
  method: FastingMethodId;
  category: FastingCategory;
  recurring: boolean;
  startTime: string; // HH:mm local
  endTime: string; // HH:mm local
  weekdays: number[]; // 0=Sun..6=Sat
  startDate: string; // ISO date
  endDate?: string;
  timezone: string;
  active: boolean;
  notificationSettings: {
    fastingBegins: boolean;
    fastingEnds: boolean;
    eatingPhaseBegins: boolean;
  };
}

/**
 * A single-day exception to a recurring FastingPlan. Editing one day must
 * never mutate the plan itself — that's the whole point of keeping this as
 * a separate, per-date record instead of a field on FastingPlan.
 */
export interface FastingPlanDayOverride {
  id: string;
  planId: string;
  userId: string;
  date: string; // ISO yyyy-mm-dd, the local calendar day this override applies to
  action: 'skip' | 'reschedule';
  overrideStartTime?: string; // HH:mm, only meaningful for 'reschedule'
  overrideEndTime?: string;
  createdAt: string;
}

export interface FastingSession {
  id: string;
  userId: string;
  fastingPlanId: string | null;
  category: FastingCategory;
  method: FastingMethodId;
  startTimestamp: string; // ISO
  plannedEndTimestamp: string; // ISO
  actualEndTimestamp: string | null;
  plannedDuration: number; // ms
  actualDuration: number | null; // ms
  status: FastingStatus;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  originalPlannedEnd: string;
  extensionCount: number;
  source: 'manual' | 'plan';
}

export const FASTING_METHODS: FastingMethodDefinition[] = [
  {
    id: '14:10',
    name: '14:10',
    category: 'intermittent',
    fastingHours: 14,
    eatingHours: 10,
    shortExplanation: 'A gentle entry point into time-restricted eating with a 10-hour eating window.',
  },
  {
    id: '16:8',
    name: '16:8',
    category: 'intermittent',
    fastingHours: 16,
    eatingHours: 8,
    shortExplanation: 'One of the most common intermittent fasting rhythms, repeated daily.',
    recommendation: 'Popular starting point',
  },
  {
    id: '18:6',
    name: '18:6',
    category: 'intermittent',
    fastingHours: 18,
    eatingHours: 6,
    shortExplanation: 'A tighter daily eating window for those already used to 16:8.',
  },
  {
    id: '20:4',
    name: '20:4',
    category: 'intermittent',
    fastingHours: 20,
    eatingHours: 4,
    shortExplanation: 'A more advanced daily rhythm sometimes called the "Warrior" pattern.',
  },
  {
    id: '24h',
    name: '24 hours',
    category: 'longer',
    fastingHours: 24,
    eatingHours: 0,
    shortExplanation: 'A full day fast, typically done occasionally rather than daily.',
  },
  {
    id: '36h',
    name: '36 hours',
    category: 'longer',
    fastingHours: 36,
    eatingHours: 0,
    shortExplanation: 'Spans a full day and two nights of sleep.',
  },
  {
    id: '48h',
    name: '48 hours',
    category: 'longer',
    fastingHours: 48,
    eatingHours: 0,
    shortExplanation: 'An extended fast that some people use occasionally.',
  },
  {
    id: '72h',
    name: '72 hours',
    category: 'longer',
    fastingHours: 72,
    eatingHours: 0,
    shortExplanation: 'A long fast that is not suitable for everyone. See safety notice before starting.',
  },
  {
    id: '96h',
    name: '96 hours',
    category: 'longer',
    fastingHours: 96,
    eatingHours: 0,
    shortExplanation: 'A very long fast that is not suitable for everyone. See safety notice before starting.',
  },
  {
    id: 'individual',
    name: 'Individual fasting',
    category: 'individual',
    fastingHours: 0,
    eatingHours: 0,
    shortExplanation: 'Choose your own start and end time. Duration is calculated automatically.',
  },
];

export const LONGER_FASTING_THRESHOLD_HOURS = 24;
