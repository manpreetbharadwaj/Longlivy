import { AppIconName, MaterialCommunityIconName } from '@/components/common/AppIcon';
import { MeditationTopic } from './models';

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
