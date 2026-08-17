import React, { useState, useCallback } from 'react';
import { View } from 'react-native';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';

/**
 * Autophagy is deliberately NOT wired to elapsed fasting time — the spec is
 * explicit that this must read as learning content, not a live, precisely
 * measured status ("Autophagy begins after 16 hours" is exactly the claim
 * we must avoid making).
 */
export const AutophagyInfoCard: React.FC = React.memo(() => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const toggle = useCallback(() => setExpanded((e) => !e), []);

  return (
    <AppCard onPress={toggle} style={{ marginBottom: theme.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppIcon name="flask-outline" size={20} color={theme.colors.info} />
        <AppText variant="headingSmall" style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
          About autophagy
        </AppText>
        <AppIcon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.colors.textTertiary} />
      </View>
      {expanded ? (
        <View style={{ marginTop: theme.spacing.xs }}>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xxs }}>
            Autophagy is a complex cellular process in which cells break down and recycle their own
            components. It is one of several processes discussed in the context of fasting.
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginBottom: theme.spacing.xxs }}>
            The activity of autophagy relevant to a given person cannot be reliably determined from a
            fixed number of fasting hours alone — individual factors such as diet, activity level and
            overall health all play a role.
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textTertiary}>
            This is educational information, not a live measurement of what is currently happening in
            your body.
          </AppText>
        </View>
      ) : (
        <AppText variant="bodySmall" color={theme.colors.textSecondary} style={{ marginTop: theme.spacing.xxs }}>
          A complex cellular process — not something this app measures live. Tap to learn more.
        </AppText>
      )}
    </AppCard>
  );
});

AutophagyInfoCard.displayName = 'AutophagyInfoCard';
