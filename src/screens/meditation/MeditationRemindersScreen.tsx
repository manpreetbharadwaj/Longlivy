import React, { useCallback, useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SectionHeroLayout } from '@/components/common/SectionHeroLayout';
import { sectionEnvironments } from '@/theme/environments';
import { HeroCard } from '@/components/common/HeroCard';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { AppSwitch } from '@/components/common/AppSwitch';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppDateField } from '@/components/common/AppDateField';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/localization';
import { useDateLocale, formatWeekdayNarrow, formatWeekdayLong } from '@/localization/locale';
import { ctaGradient } from '@/theme/gradients';
import { dashboardColors } from '@/features/dashboard/dashboardTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationReminders } from '@/features/meditation/selectors';
import { saveMeditationReminderThunk, deleteMeditationReminderThunk } from '@/features/meditation/meditationSlice';
import { MeditationReminder } from '@/features/meditation/models';

const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_ONLY = [1, 2, 3, 4, 5];

// A fixed, known-Sunday-anchored week used purely to format weekday
// abbreviations via Intl (see formatWeekdayNarrow/Long) — the actual dates
// are never shown, only which day-of-week they fall on.
function buildReferenceWeek(): Date[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return ALL_WEEKDAYS.map((offset) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + offset);
    return d;
  });
}
const REFERENCE_WEEK = buildReferenceWeek();

function timeToDate(time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export const MeditationRemindersScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const locale = useDateLocale();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const reminders = useAppSelector(selectMeditationReminders);

  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = editor closed, null = creating, string = editing that id
  const [draftTime, setDraftTime] = useState(new Date());
  const [draftDays, setDraftDays] = useState<number[]>(WEEKDAYS_ONLY);
  // Whether Save should (re)schedule or just update stored configuration —
  // true when creating (a new reminder is active immediately) or editing an
  // already-enabled one; false when editing a disabled reminder, which Save
  // must not silently re-enable (Section 13) — only the list row's own
  // switch does that.
  const [draftEnabledIntent, setDraftEnabledIntent] = useState(true);
  const [permissionDeniedNotice, setPermissionDeniedNotice] = useState(false);
  const [saving, setSaving] = useState(false);
  // Ids with an in-flight toggleReminder — saveMeditationReminderThunk reads
  // `existing` from Redux state at call time, so two overlapping calls for
  // the same reminder (a fast double-tap on its switch, before the first
  // dispatch's fulfilled action lands) would both see the same stale
  // `notificationIds`, neither would cancel the other's schedule, and
  // whichever resolves last would win in storage — leaving the loser's OS
  // schedule orphaned and silently double-firing forever (Section 25 QA
  // finding). Disabling a reminder's switch for the duration of its own
  // toggle closes that window without affecting other reminders' switches.
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());

  const notificationContent = useMemo(
    () => ({ title: t('meditation.remindersScreen.notificationTitle'), body: t('meditation.remindersScreen.notificationBody') }),
    [t]
  );

  const summarizeDays = useCallback(
    (daysOfWeek: number[]): string => {
      const sorted = [...daysOfWeek].sort((a, b) => a - b);
      if (sorted.length === 7) return t('meditation.remindersScreen.everyDay');
      if (sorted.length === 5 && WEEKDAYS_ONLY.every((d) => sorted.includes(d))) return t('meditation.remindersScreen.weekdays');
      return sorted.map((d) => formatWeekdayNarrow(REFERENCE_WEEK[d], locale)).join(' · ');
    },
    [t, locale]
  );

  const openCreate = useCallback(() => {
    setDraftTime(new Date());
    setDraftDays(WEEKDAYS_ONLY);
    setDraftEnabledIntent(true);
    setPermissionDeniedNotice(false);
    setEditingId(null);
  }, []);

  const openEdit = useCallback((reminder: MeditationReminder) => {
    setDraftTime(timeToDate(reminder.time));
    setDraftDays(reminder.daysOfWeek);
    setDraftEnabledIntent(reminder.enabled);
    setPermissionDeniedNotice(false);
    setEditingId(reminder.id);
  }, []);

  const closeEditor = useCallback(() => setEditingId(undefined), []);

  const toggleDraftDay = useCallback((day: number) => {
    setDraftDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)));
  }, []);

  const saveDraft = useCallback(async () => {
    if (draftDays.length === 0) return;
    setSaving(true);
    setPermissionDeniedNotice(false);
    const result = await dispatch(
      saveMeditationReminderThunk({
        id: editingId ?? undefined,
        time: dateToTime(draftTime),
        daysOfWeek: draftDays,
        enabledIntent: draftEnabledIntent,
        notificationContent,
      })
    ).unwrap();
    setSaving(false);
    if (result.permissionDenied) {
      setPermissionDeniedNotice(true);
      return;
    }
    setEditingId(undefined);
  }, [dispatch, editingId, draftTime, draftDays, draftEnabledIntent, notificationContent]);

  const deleteDraft = useCallback(async () => {
    if (editingId) await dispatch(deleteMeditationReminderThunk(editingId));
    setEditingId(undefined);
  }, [dispatch, editingId]);

  const toggleReminder = useCallback(
    async (reminder: MeditationReminder) => {
      if (togglingIds.has(reminder.id)) return;
      setTogglingIds((prev) => new Set(prev).add(reminder.id));
      try {
        const result = await dispatch(
          saveMeditationReminderThunk({
            id: reminder.id,
            time: reminder.time,
            daysOfWeek: reminder.daysOfWeek,
            enabledIntent: !reminder.enabled,
            notificationContent,
          })
        ).unwrap();
        if (result.permissionDenied) setPermissionDeniedNotice(true);
      } finally {
        setTogglingIds((prev) => {
          const next = new Set(prev);
          next.delete(reminder.id);
          return next;
        });
      }
    },
    [dispatch, notificationContent, togglingIds]
  );

  const isEditorOpen = editingId !== undefined;

  return (
    <SectionHeroLayout environment={sectionEnvironments.meditation} title={t('meditation.remindersScreen.title')} onBack={() => navigation.goBack()}>
      <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" style={{ marginBottom: theme.spacing.md }}>
        {t('meditation.remindersScreen.disclaimer')}
      </AppText>

      {permissionDeniedNotice ? (
        <HeroCard style={{ marginBottom: theme.spacing.md, borderColor: '#C97B6B', borderWidth: 1 }}>
          <AppText variant="bodySmall" color="#E5A79A">
            {t('meditation.remindersScreen.permissionDenied')}
          </AppText>
        </HeroCard>
      ) : null}

      {reminders.length === 0 && !isEditorOpen ? (
        <View style={{ alignItems: 'center', paddingVertical: theme.spacing.xl }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: 'rgba(255,255,255,0.08)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <AppIcon name="notifications-outline" size={30} color="rgba(255,255,255,0.5)" />
          </View>
          <AppText variant="headingSmall" color="#FFFFFF" align="center">
            {t('meditation.remindersScreen.empty')}
          </AppText>
        </View>
      ) : (
        reminders.map((reminder) => (
          <HeroCard key={reminder.id} onPress={() => openEdit(reminder)} style={{ marginBottom: theme.spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <AppText variant="headingSmall" color="#FFFFFF">
                  {reminder.time}
                </AppText>
                <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }}>
                  {summarizeDays(reminder.daysOfWeek)}
                </AppText>
              </View>
              <AppSwitch
                value={reminder.enabled}
                onValueChange={() => toggleReminder(reminder)}
                disabled={togglingIds.has(reminder.id)}
                variant="hero"
              />
            </View>
          </HeroCard>
        ))
      )}

      {isEditorOpen ? (
        <HeroCard style={{ marginTop: theme.spacing.sm }}>
          <AppDateField label={t('meditation.remindersScreen.time')} mode="time" value={draftTime} onChange={setDraftTime} variant="hero" />

          <AppText variant="bodySmall" color="rgba(255,255,255,0.6)" style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.xs }}>
            {t('meditation.remindersScreen.days')}
          </AppText>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {ALL_WEEKDAYS.map((day) => {
              const selected = draftDays.includes(day);
              return (
                <Pressable
                  key={day}
                  onPress={() => toggleDraftDay(day)}
                  accessibilityRole="button"
                  accessibilityLabel={formatWeekdayLong(REFERENCE_WEEK[day], locale)}
                  accessibilityState={{ selected }}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? dashboardColors.accent : 'rgba(255,255,255,0.08)',
                  }}
                >
                  <AppText variant="bodySmall" color={selected ? dashboardColors.background : 'rgba(255,255,255,0.7)'}>
                    {formatWeekdayNarrow(REFERENCE_WEEK[day], locale)}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          {draftDays.length === 0 ? (
            <AppText variant="caption" color="#E5A79A" style={{ marginTop: theme.spacing.xs }}>
              {t('meditation.remindersScreen.selectAtLeastOneDay')}
            </AppText>
          ) : null}
          {editingId != null && !draftEnabledIntent ? (
            <AppText variant="caption" color="rgba(255,255,255,0.5)" style={{ marginTop: theme.spacing.xs }}>
              {t('meditation.remindersScreen.savingWhileOff')}
            </AppText>
          ) : null}

          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            {editingId != null ? (
              <Pressable
                onPress={deleteDraft}
                accessibilityRole="button"
                accessibilityLabel={t('common.delete')}
                style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <AppIcon name="trash-outline" size={20} color="rgba(255,255,255,0.7)" />
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
              <AppGradientButton label={t('common.cancel')} onPress={closeEditor} colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.08)']} disabled={saving} />
            </View>
            <View style={{ flex: 1 }}>
              <AppGradientButton label={t('common.save')} onPress={saveDraft} colors={ctaGradient} disabled={saving || draftDays.length === 0} />
            </View>
          </View>
        </HeroCard>
      ) : (
        <AppGradientButton label={t('meditation.remindersScreen.add')} onPress={openCreate} colors={ctaGradient} style={{ marginTop: theme.spacing.sm }} />
      )}
    </SectionHeroLayout>
  );
};
