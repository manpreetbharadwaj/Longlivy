import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroTextField } from '@/components/common/HeroTextField';
import { HeroCard } from '@/components/common/HeroCard';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteWeightThunk, logWeightThunk, updateWeightThunk } from '@/features/weight/weightSlice';
import { selectCurrentWeight, selectWeightHistory } from '@/features/weight/selectors';
import { setBodyProfile } from '@/features/calories/calorieSlice';

/** The API accepts 1–700 (kg or lb); anything outside is a typo, not a weight. */
const MIN_KG = 1;
const MAX_KG = 700;
const RECENT_COUNT = 10;

function parseWeight(text: string): number | null {
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) && value >= MIN_KG && value <= MAX_KG ? Math.round(value * 10) / 10 : null;
}

export const EnterWeightScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const current = useAppSelector(selectCurrentWeight);
  const history = useAppSelector(selectWeightHistory);
  const [weight, setWeight] = useState(current ? String(current.weightKg) : '');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const recent = useMemo(() => [...history].reverse().slice(0, RECENT_COUNT), [history]);
  const parsed = parseWeight(weight);

  const save = useCallback(async () => {
    if (parsed === null || saving) return;
    setSaving(true);
    const result = editingId ? await dispatch(updateWeightThunk({ id: editingId, weightKg: parsed })) : await dispatch(logWeightThunk(parsed));
    setSaving(false);
    if (result.meta.requestStatus === 'rejected') {
      Alert.alert('Weight not saved', (result as { error?: { message?: string } }).error?.message ?? 'Please try again.');
      return;
    }
    // Editing an older entry must not change the current body weight.
    if (!editingId || editingId === current?.id) dispatch(setBodyProfile({ weightKg: parsed }));
    if (editingId) {
      setEditingId(null);
      setWeight(current ? String(current.weightKg) : '');
      return;
    }
    navigation.goBack();
  }, [parsed, saving, editingId, dispatch, current, navigation]);

  const startEdit = useCallback((id: string, weightKg: number) => {
    setEditingId(id);
    setWeight(String(weightKg));
  }, []);

  const confirmDelete = useCallback(
    (id: string, weightKg: number, timestamp: string) => {
      Alert.alert('Delete this entry?', `${weightKg} kg · ${new Date(timestamp).toLocaleDateString()}`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await dispatch(deleteWeightThunk(id));
            if (deleteWeightThunk.rejected.match(result)) Alert.alert('Entry not deleted', result.error.message ?? 'Please try again.');
            if (editingId === id) setEditingId(null);
          },
        },
      ]);
    },
    [dispatch, editingId],
  );

  return (
    <TabHeroLayout title={editingId ? 'Edit weight' : 'Enter weight'} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        Manually entered weight is marked separately from values imported from a connected health platform.
      </AppText>
      <HeroTextField label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" style={{ marginBottom: theme.spacing.xs }} />
      {weight && parsed === null ? (
        <AppText variant="bodySmall" color="#F2A08F" style={{ marginBottom: theme.spacing.xs }}>
          Enter a weight between {MIN_KG} and {MAX_KG} kg.
        </AppText>
      ) : null}
      <AppGradientButton label={editingId ? 'Update entry' : 'Save weight'} onPress={save} disabled={parsed === null} loading={saving} style={{ marginTop: theme.spacing.sm }} />
      {editingId ? (
        <Pressable onPress={() => { setEditingId(null); setWeight(current ? String(current.weightKg) : ''); }} accessibilityRole="button" style={{ alignSelf: 'center', padding: theme.spacing.sm }}>
          <AppText variant="bodySmall" color="rgba(255,255,255,0.7)">
            Cancel editing
          </AppText>
        </Pressable>
      ) : null}

      {recent.length > 0 ? (
        <>
          <AppText variant="headingSmall" color="#FFFFFF" style={{ marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs }}>
            Recent entries
          </AppText>
          {recent.map((entry) => (
            <HeroCard
              key={entry.id}
              onPress={() => startEdit(entry.id, entry.weightKg)}
              accessibilityLabel={`Edit ${entry.weightKg} kg entry`}
              style={{ marginBottom: theme.spacing.xs, borderColor: editingId === entry.id ? '#5C7A94' : 'rgba(255,255,255,0.14)', borderWidth: editingId === entry.id ? 2 : 1.5 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyMedium" color="#FFFFFF">
                    {entry.weightKg} kg
                  </AppText>
                  <AppText variant="caption" color="rgba(255,255,255,0.55)">
                    {new Date(entry.timestamp).toLocaleString()}
                    {entry.source !== 'manual' ? ' · imported' : ''}
                  </AppText>
                </View>
                <Pressable onPress={() => confirmDelete(entry.id, entry.weightKg, entry.timestamp)} accessibilityRole="button" accessibilityLabel={`Delete ${entry.weightKg} kg entry`} hitSlop={10}>
                  <AppIcon name="trash-outline" size={18} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
            </HeroCard>
          ))}
        </>
      ) : null}
    </TabHeroLayout>
  );
};
