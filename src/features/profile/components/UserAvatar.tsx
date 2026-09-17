import React from 'react';
import { View, Text, StyleProp, ViewStyle } from 'react-native';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { getAvatarPreset } from '@/features/profile/avatars';

interface UserAvatarProps {
  /**
   * Stable avatar id from the user profile. Anything that isn't a known
   * preset — `undefined`, `'initial'`, or a stale id from an older build —
   * renders the initial-letter fallback.
   */
  avatarId?: string | null;
  /** Display name; only its first character is ever shown (see `initialFromName`). */
  name?: string | null;
  /** Rendered width & height in px. The avatar is always a circle. */
  size: number;
  /** Draw the circular accent ring. Default `true`. */
  ring?: boolean;
  /** Ring colour and initial-letter colour. Defaults to the dashboard accent. */
  color?: string;
  /**
   * Fill behind the initial letter. Defaults to the dashboard elevated
   * surface; pass `'transparent'` when a parent already provides the disc
   * (e.g. the Profile header's glowing ring).
   */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * First initial of a display name, upper-cased — never the full name, never
 * more than one character. Falls back to `'?'` for a missing / empty /
 * whitespace-only name.
 *
 *   initialFromName('Alex Rivera') // 'A'
 *   initialFromName('manpreet')    // 'M'
 *   initialFromName('   ')         // '?'
 */
export const initialFromName = (name?: string | null): string => name?.trim()?.charAt(0)?.toUpperCase() || '?';

/**
 * The single place profile-avatar rendering lives — used by the Profile
 * header, the dashboard/meditation top bars, the Edit Profile row and the
 * avatar picker. Resolves a stored `avatarId` to a bundled vector preset,
 * and falls back to the user's first initial whenever the id is missing,
 * `'initial'`, or unknown, so a removed preset or a not-yet-loaded profile
 * degrades cleanly.
 *
 * Layout notes for the initial-letter fallback:
 *  - a raw <Text> (not AppText) so no typography variant can inject a fixed
 *    `lineHeight` smaller than the glyph — that was the old clipping bug;
 *  - `fontSize` and `lineHeight` are both proportional to `size`, so it
 *    scales with every avatar variant instead of one hardcoded value;
 *  - `includeFontPadding: false` + `textAlignVertical: 'center'` kill
 *    Android's extra vertical font padding; `textAlign: 'center'` + full
 *    width centre it horizontally; the parent centres the line box;
 *  - `allowFontScaling={false}` keeps the monogram inside the circle
 *    regardless of the OS font-size setting.
 *
 * Preset artwork is square SVG scaled to `size` (viewBox-based, so it never
 * stretches or blurs) and needs no network access.
 */
export const UserAvatar: React.FC<UserAvatarProps> = React.memo(
  ({
    avatarId,
    name,
    size,
    ring = true,
    color = dashboardColors.accent,
    backgroundColor = dashboardColors.surfaceElevated,
    style,
  }) => {
    const preset = getAvatarPreset(avatarId);
    const initial = initialFromName(name);

    return (
      <View
        accessibilityRole="image"
        accessibilityLabel={preset ? `${preset.label} avatar` : `Profile initial ${initial}`}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: preset ? 'transparent' : backgroundColor,
            borderWidth: ring ? 1.5 : 0,
            borderColor: color,
          },
          style,
        ]}
      >
        {preset ? (
          <preset.Art size={size} />
        ) : (
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={{
              width: '100%',
              color,
              fontSize: Math.round(size * 0.4),
              lineHeight: Math.round(size * 0.46),
              fontWeight: '700',
              textAlign: 'center',
              textAlignVertical: 'center',
              includeFontPadding: false,
            }}
          >
            {initial}
          </Text>
        )}
      </View>
    );
  }
);

UserAvatar.displayName = 'UserAvatar';
