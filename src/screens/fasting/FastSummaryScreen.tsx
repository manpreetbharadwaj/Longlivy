import { fastingStatusLabel } from '@/features/fasting/services/fastingFormat';
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
import { useTranslation } from '@/localization';
import { fastingRepository } from '@/features/fasting/repository/MockFastingRepository';
import { FastingSession } from '@/features/fasting/models';
import { formatDurationHM } from '@/features/fasting/services/FastingCalculator';
import { sessionModelLabel } from '@/features/fasting/services/fastingPlanSchedule';

export const FastSummaryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
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
          {goalMet ? t('fasting.summary.fastCompleted') : t('fasting.summary.fastEnded')}
        </AppText>
        <AppBadge label={fastingStatusLabel(session.status, t)} tone={goalMet ? 'success' : 'warning'} />
      </View>

      <AppCard>
        <Row label={t('fasting.summary.method')} value={sessionModelLabel(session, t)} />
        <Row label={t('fasting.summary.category')} value={session.category} />
        <Row label={t('fasting.summary.plannedDuration')} value={formatDurationHM(session.plannedDuration)} />
        <Row label={t('fasting.summary.actualDuration')} value={formatDurationHM(session.actualDuration ?? 0)} />
        <Row label={t('fasting.summary.started')} value={new Date(session.startTimestamp).toLocaleString()} />
        <Row label={t('fasting.summary.ended')} value={session.actualEndTimestamp ? new Date(session.actualEndTimestamp).toLocaleString() : '—'} last />
      </AppCard>

      <AppButton label={t('fasting.summary.backToFasting')} onPress={() => navigation.popToTop()} style={{ marginTop: theme.spacing.lg }} />
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
