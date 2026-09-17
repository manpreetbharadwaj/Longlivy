import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppIcon, AppIconName, MaterialCommunityIconName } from './AppIcon';

interface AppIconTileProps {
  name: AppIconName | MaterialCommunityIconName;
  family?: 'ionicons' | 'material-community';
  color?: string;
  size?: number;
  iconSize?: number;
  shape?: 'circle' | 'rounded';
  style?: ViewStyle | ViewStyle[];
}

/**
 * A tinted, softly-backed container for an icon — the recurring "colored
 * chip with a glyph inside" pattern used across cards, quick actions and
 * empty states. Keeps icon presentation consistent instead of every screen
 * rolling its own background/size math.
 */
export const AppIconTile: React.FC<AppIconTileProps> = React.memo(({ name, family, color, size = 40, iconSize, shape = 'rounded', style }) => {
  const { theme } = useTheme();
  const tint = color ?? theme.colors.primary;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: shape === 'circle' ? size / 2 : theme.radius.md,
          backgroundColor: tint + '1F',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <AppIcon name={name} family={family} size={iconSize ?? Math.round(size * 0.5)} color={tint} />
    </View>
  );
});

AppIconTile.displayName = 'AppIconTile';
