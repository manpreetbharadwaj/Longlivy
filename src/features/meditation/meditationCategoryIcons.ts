import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { MeditationTopic, MeditationType } from './models';

export interface MeditationCategoryIcon {
  name: AppIconName | MaterialCommunityIconName;
  family?: 'ionicons' | 'material-community';
}

/** One calm, semantically-appropriate glyph per canonical `MeditationTopic` — deliberately plain marks, nothing game-like. */
const TOPIC_ICONS: Record<MeditationTopic, MeditationCategoryIcon> = {
  morning: { name: 'sunny-outline' },
  mindfulness: { name: 'meditation', family: 'material-community' },
  energy: { name: 'flash-outline' },
  focus: { name: 'locate-outline' },
  relaxation: { name: 'flower-outline' },
  calm: { name: 'water-outline' },
  stress_relief: { name: 'leaf-outline' },
  sleep: { name: 'moon-outline' },
};

export function getMeditationCategoryIcon(topic: MeditationTopic): MeditationCategoryIcon {
  return TOPIC_ICONS[topic];
}

/** Icons for the three top-level modes — Breathing's icon lives here (mode level), not as a topic. */
export const MEDITATION_MODE_ICONS: Record<MeditationType, MeditationCategoryIcon> = {
  guided: { name: 'headset-outline' },
  free: { name: 'leaf-outline' },
  breathing: { name: 'weather-windy', family: 'material-community' },
};
