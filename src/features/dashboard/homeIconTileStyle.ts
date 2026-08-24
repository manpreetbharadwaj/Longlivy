import { ViewStyle } from 'react-native';
import { dashboardColors } from './dashboardTheme';

/** Icon-tile surface for the dashboard's category icons (Activity/Meditation/Weight cards, Quick Actions) — a dark, subtly-bordered chip rather than a filled color block, so the category color reads through the icon glyph itself instead of the tile background. */
export const homeIconTileStyle: ViewStyle = {
  backgroundColor: dashboardColors.surfaceSecondary,
  borderWidth: 1,
  borderColor: dashboardColors.border,
};
