import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FastingStackParamList } from '@/navigation/types';
import { AppScreen } from '@/components/common/AppScreen';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppBadge } from '@/components/common/AppBadge';
import { AppLoader } from '@/components/common/AppLoader';
import { AppIconTile } from '@/components/common/AppIconTile';
import { useTheme } from '@/hooks/useTheme';
import { fastingRepository } from '@/features/fasting/repository/MockFastingRepository';
import { FastingSession } from '@/features/fasting/models';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';

export const FastSummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<FastingStackParamList>>();
  const route = useRoute<RouteProp<FastingStackParamList, 'FastSummary'>>();
  const [session, setSession] = useState<FastingSession | null>(null);

  useEffect(() => {
    fastingRepository.getSession(route.params.sessionId).then(setSession);
  }, [route.params.sessionId]);

  if (!session) return <AppLoader fullscreen />;

  const goalMet = session.status === 'completed';

  return (
    <AppScreen>
      <View style={{ alignItems: 'center', marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
        <AppIconTile
          name={goalMet ? 'trophy' : 'leaf-outline'}
          shape="circle"
          color={goalMet ? theme.colors.success : theme.colors.warning}
          size={72}
          iconSize={34}
        />
        <AppText variant="displayMedium" align="center" style={{ marginTop: theme.spacing.xs }}>
          {goalMet ? 'Fast completed' : 'Fast ended'}
        </AppText>
        <AppBadge label={session.status.replace('_', ' ')} tone={goalMet ? 'success' : 'warning'} />
      </View>

      <AppCard>
        <Row label="Method" value={session.method} />
        <Row label="Category" value={session.category} />
        <Row label="Planned duration" value={formatDurationHM(session.plannedDuration)} />
        <Row label="Actual duration" value={formatDurationHM(session.actualDuration ?? 0)} />
        <Row label="Started" value={new Date(session.startTimestamp).toLocaleString()} />
        <Row label="Ended" value={session.actualEndTimestamp ? new Date(session.actualEndTimestamp).toLocaleString() : '—'} last />
      </AppCard>

      <AppButton label="Back to Fasting" onPress={() => navigation.popToTop()} style={{ marginTop: theme.spacing.lg }} />
    </AppScreen>
  );
};

const Row: React.FC<{ label: string; value: string; last?: boolean }> = ({ label, value, last }) => {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <AppText variant="bodyMedium" color={theme.colors.textSecondary} style={{ textTransform: 'capitalize' }}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={{ textTransform: 'capitalize' }}>
        {value}
      </AppText>
    </View>
  );
};
