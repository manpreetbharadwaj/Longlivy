import React from 'react';
import { View } from 'react-native';
import { AppText } from './AppText';

interface HeroLegendDotProps {
  color: string;
  label: string;
}

/** Small colored-dot + label used under the animated ring visuals on the hero onboarding screens (nutrition macro ring, fasting window ring). */
export const HeroLegendDot: React.FC<HeroLegendDotProps> = React.memo(({ color, label }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 }}>
    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color, marginRight: 5 }} />
    <AppText variant="caption" color="rgba(255,255,255,0.6)">
      {label}
    </AppText>
  </View>
));

HeroLegendDot.displayName = 'HeroLegendDot';
