/**
 * Content for the fasting timeline — deliberately organized as broad,
 * overlapping phases (not sharp checkpoints) with hedged, range-based
 * language throughout ("typically", "can", "for many people", "~"). Never
 * assert that a specific physiological event happens at an exact hour for
 * a given individual — the ranges below are rough, commonly-cited windows
 * from fasting-physiology literature, presented as educational context,
 * not a live measurement of what is currently happening in this user's
 * body. This file is the single source of truth for that copy so the
 * ActiveFastScreen timeline never drifts from these constraints.
 */

export interface TimelineMilestone {
  /** Anchor hour used only to compute "reached" state — always displayed with "~" and range language, never as a bare precise timestamp. */
  hours: number;
  title: string;
  description: string;
}

export interface TimelinePhase {
  key: string;
  label: string;
  rangeLabel: string;
  color: string;
  milestones: TimelineMilestone[];
}

export const TIMELINE_PHASES: TimelinePhase[] = [
  {
    key: 'fed',
    label: 'Fed state',
    rangeLabel: '0–3h',
    color: '#C9974E',
    milestones: [
      { hours: 0, title: 'Fasting started', description: 'Your eating window has closed for this session.' },
      { hours: 1.5, title: 'Digesting your last meal', description: 'Nutrients from your last meal are still being absorbed into your bloodstream.' },
    ],
  },
  {
    key: 'early',
    label: 'Early fasting',
    rangeLabel: '~3–8h',
    color: '#D9C25F',
    milestones: [
      { hours: 3.5, title: 'Blood sugar stabilizing', description: 'Blood glucose and insulin typically begin returning toward baseline as your last meal is fully processed.' },
      { hours: 7, title: 'Glycogen becomes the main fuel', description: 'As glucose from food runs low, the liver increasingly taps stored glycogen for energy.' },
    ],
  },
  {
    key: 'glycogen',
    label: 'Glycogen phase',
    rangeLabel: '~8–16h',
    color: '#6E8FAE',
    milestones: [
      { hours: 10, title: 'Insulin continues to decline', description: 'Lower insulin levels are generally associated with increased fat breakdown.' },
      {
        hours: 14,
        title: 'Metabolic switching begins',
        description: 'The body gradually shifts toward burning proportionally more fat as glycogen reserves draw down — a gradual transition, not a switch that flips at a specific hour.',
      },
    ],
  },
  {
    key: 'fat-adapted',
    label: 'Fat-adapted phase',
    rangeLabel: '~16–24h',
    color: '#3D5266',
    milestones: [
      { hours: 18, title: 'Fat metabolism increases', description: 'Fat becomes an increasingly important energy source for many people in this window.' },
      {
        hours: 21,
        title: 'Ketone production can begin to rise',
        description: 'The liver may start converting more fat into ketone bodies, an alternative fuel especially useful for the brain. Timing varies significantly between individuals.',
      },
    ],
  },
  {
    key: 'extended',
    label: 'Extended fasting',
    rangeLabel: '24h+',
    color: '#8B7FA8',
    milestones: [
      { hours: 24, title: 'One full day', description: "You've completed a full 24 hours without food." },
      {
        hours: 36,
        title: 'Deeper ketosis for many people',
        description: 'Ketone levels can continue rising over this window for many people, though this app does not measure this directly.',
      },
      {
        hours: 48,
        title: 'Extended fasting territory',
        description: 'Individual variation becomes more pronounced the longer a fast continues — review the safety notice before attempting fasts this long.',
      },
      {
        hours: 72,
        title: 'Three days',
        description: 'A significant fasting duration. Following medical guidance is strongly recommended for fasts this long.',
      },
    ],
  },
];

export const ALL_TIMELINE_MILESTONES: TimelineMilestone[] = TIMELINE_PHASES.flatMap((phase) => phase.milestones);
