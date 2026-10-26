import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// expo-file-system's default export moved to a new File/Directory/Paths API in
// recent SDKs; `/legacy` keeps the documentDirectory/writeAsStringAsync shape
// this screen already uses, with no behavior change.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { HeroTextField } from '@/components/common/HeroTextField';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { store as reduxStore } from '@/store/store';
import { LocalStore } from '@/services/storage/LocalStore';
import { bootstrapSession, logoutThunk } from '@/features/auth/authSlice';
import { loadFastingData } from '@/features/fasting/fastingSlice';
import { loadTodayMeals, loadFavoriteFoods } from '@/features/nutrition/nutritionSlice';
import { loadActivityData } from '@/features/activity/activitySlice';
import { loadMeditationData } from '@/features/meditation/meditationSlice';
import { loadWeightHistory } from '@/features/weight/weightSlice';
import { env } from '@/config/env';
import { authService } from '@/services/auth/authService';

/** Domains that make up "your data" for export/deletion — deliberately excludes UI-only state (theme, nav). */
function exportableSnapshot() {
  const state = reduxStore.getState();
  return {
    exportedAt: new Date().toISOString(),
    profile: state.profile,
    fasting: state.fasting,
    nutrition: state.nutrition,
    activity: state.activity,
    calorie: state.calorie,
    weight: state.weight,
    meditation: state.meditation,
    goals: state.goals,
    notification: state.notification,
    healthIntegration: state.healthIntegration,
  };
}

export const DataManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const fasting = useAppSelector((s) => s.fasting.history.length);
  const meals = useAppSelector((s) => s.nutrition.todayMeals.length);
  const activities = useAppSelector((s) => s.activity.history.length);
  const meditations = useAppSelector((s) => s.meditation.history.length);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [password, setPassword] = useState('');

  const rows = [
    { label: 'Fasting sessions stored', value: fasting },
    { label: "Today's meals stored", value: meals },
    { label: 'Activities stored', value: activities },
    { label: 'Meditation sessions stored', value: meditations },
  ];

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const json = JSON.stringify(exportableSnapshot(), null, 2);
      if (!FileSystem.documentDirectory) throw new Error('Document directory is unavailable on this device.');
      const uri = `${FileSystem.documentDirectory}longlivy-data-export.json`;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export Longlivy data' });
      } else {
        Alert.alert('Export ready', `Your data was written to:\n${uri}`);
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  }, []);

  const performDeletion = useCallback(async () => {
    setDeleting(true);
    try {
      if (!env.useMockApi) {
        // The server account goes first: if the password is wrong or the
        // request fails, nothing on the device is touched.
        try {
          await authService.deleteAccount(password);
        } catch (e) {
          Alert.alert('Account not deleted', e instanceof Error ? e.message : 'Please try again.');
          return;
        }
      }
      await LocalStore.clearAll();
      // In API mode the bearer token lives in SecureStore, not a LocalStore;
      // revoke and clear it so "signs you out" is actually true.
      if (!env.useMockApi) await dispatch(logoutThunk());
      // Re-bootstraps session + onboarding status from the now-empty stores,
      // so this device is treated as brand new (back through onboarding),
      // not left showing a stale "onboarding already done" flag.
      await dispatch(bootstrapSession());
      // Best-effort refresh so any screen still mounted reflects the reset state
      // immediately (mock mode only — in API mode the user is now signed out).
      if (env.useMockApi) await Promise.all([
        dispatch(loadFastingData()),
        dispatch(loadTodayMeals()),
        dispatch(loadFavoriteFoods()),
        dispatch(loadActivityData()),
        dispatch(loadMeditationData()),
        dispatch(loadWeightHistory()),
      ]);
    } finally {
      setDeleting(false);
    }
  }, [dispatch, password]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      env.useMockApi ? 'Delete all my data?' : 'Delete your account?',
      env.useMockApi
        ? 'This permanently clears everything stored on this device — fasting, nutrition, activity, meditation and weight history — and signs you out. This cannot be undone.'
        : 'This permanently deletes your LongLivy account and everything saved to it, clears this device and signs you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete everything', style: 'destructive', onPress: performDeletion },
      ]
    );
  }, [performDeletion]);

  return (
    <TabHeroLayout title="Data management" onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        {env.useMockApi
          ? 'All data currently lives on this device via local mock repositories. Each item below carries a source tag so its origin stays traceable once real sync is added.'
          : 'Your fasting, nutrition, weight, activity and meditation records, fasting plans and custom meditations are stored in your LongLivy account. Days you skip in a fasting plan stay on this device.'}
      </AppText>
      <HeroCard style={{ marginBottom: theme.spacing.lg }}>
        {rows.map((r) => (
          <AppText key={r.label} variant="bodyMedium" color="rgba(255,255,255,0.8)" style={{ marginBottom: theme.spacing.xs }}>
            {r.label}:{' '}
            <AppText variant="headingSmall" color="#FFFFFF">
              {r.value}
            </AppText>
          </AppText>
        ))}
      </HeroCard>

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
        Export your data
      </AppText>
      <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.sm }}>
        Download a JSON copy of everything Longlivy has stored for you.
      </AppText>
      <HeroCard onPress={exporting ? undefined : handleExport} style={{ marginBottom: theme.spacing.lg, paddingVertical: theme.spacing.sm }}>
        <AppText variant="headingSmall" color="#FFFFFF" align="center">
          {exporting ? 'Exporting…' : 'Export my data'}
        </AppText>
      </HeroCard>

      <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
        Delete your data
      </AppText>
      <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.sm }}>
        {env.useMockApi
          ? 'Permanently erase all locally stored data and sign out of this device.'
          : 'Permanently delete your LongLivy account and all of its data. Enter your password to confirm.'}
      </AppText>
      {!env.useMockApi ? (
        <HeroTextField label="Password" value={password} onChangeText={setPassword} isPassword autoCapitalize="none" style={{ marginBottom: theme.spacing.sm }} />
      ) : null}
      <AppGradientButton
        label={env.useMockApi ? 'Delete all my data' : 'Delete my account'}
        onPress={handleDelete}
        loading={deleting}
        disabled={!env.useMockApi && !password}
        colors={['#DD7A68', '#C4463A']}
      />
    </TabHeroLayout>
  );
};
