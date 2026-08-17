import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { AppHeader } from '@/components/common/AppHeader';
import { AppScreen } from '@/components/common/AppScreen';
import { AppCard } from '@/components/common/AppCard';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';
import { AppInput } from '@/components/common/AppInput';
import { AppEmptyState } from '@/components/common/AppEmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationTemplates } from '@/features/meditation/selectors';
import { saveMeditationTemplateThunk } from '@/features/meditation/meditationSlice';
import { generateId } from '@/utils/id';
import { DEMO_USER_ID } from '@/mock/demoUser';
import { SafeAreaView } from 'react-native-safe-area-context';

export const MeditationTemplatesScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<MeditationStackParamList>>();
  const dispatch = useAppDispatch();
  const templates = useAppSelector(selectMeditationTemplates);
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('15');

  const create = useCallback(() => {
    if (!name.trim()) return;
    dispatch(
      saveMeditationTemplateThunk({
        id: generateId('template'),
        userId: DEMO_USER_ID,
        name,
        durationSeconds: (Number(minutes) || 10) * 60,
        type: 'free',
        breathingEnabled: false,
        closingSoundEnabled: true,
      })
    );
    setName('');
  }, [dispatch, name, minutes]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <AppHeader title="My templates" onBack={() => navigation.goBack()} />
      <AppScreen scroll={false}>
        <AppCard style={{ marginBottom: theme.spacing.md }}>
          <AppText variant="headingSmall" style={{ marginBottom: theme.spacing.xs }}>
            New template
          </AppText>
          <AppInput label="Name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.sm }} />
          <AppInput label="Duration (minutes)" value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
          <AppButton label="Save template" onPress={create} disabled={!name.trim()} />
        </AppCard>
        <FlatList
          data={templates}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppCard
              onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: item.type, durationSeconds: item.durationSeconds })}
              style={{ marginBottom: theme.spacing.sm }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="headingSmall">{item.name}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {Math.round(item.durationSeconds / 60)} min
                </AppText>
              </View>
            </AppCard>
          )}
          ListEmptyComponent={<AppEmptyState title="No templates yet" message="Save a personal meditation configuration to reuse it in one tap." />}
        />
      </AppScreen>
    </SafeAreaView>
  );
};
