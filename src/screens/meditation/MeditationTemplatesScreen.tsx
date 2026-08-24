import React, { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MeditationStackParamList } from '@/navigation/types';
import { TabHeroLayout } from '@/components/common/TabHeroLayout';
import { HeroCard } from '@/components/common/HeroCard';
import { HeroTextField } from '@/components/common/HeroTextField';
import { AppGradientButton } from '@/components/common/AppGradientButton';
import { AppText } from '@/components/common/AppText';
import { AppIcon } from '@/components/common/AppIcon';
import { useTheme } from '@/hooks/useTheme';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectMeditationTemplates } from '@/features/meditation/selectors';
import { saveMeditationTemplateThunk } from '@/features/meditation/meditationSlice';
import { generateId } from '@/utils/id';
import { DEMO_USER_ID } from '@/mock/demoUser';

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
    <TabHeroLayout title="My templates" onBack={() => navigation.goBack()} scroll={false}>
      <HeroCard style={{ marginBottom: theme.spacing.md }}>
        <AppText variant="headingSmall" color="#FFFFFF" style={{ marginBottom: theme.spacing.xs }}>
          New template
        </AppText>
        <HeroTextField label="Name" value={name} onChangeText={setName} style={{ marginBottom: theme.spacing.sm }} />
        <HeroTextField label="Duration (minutes)" value={minutes} onChangeText={setMinutes} keyboardType="numeric" style={{ marginBottom: theme.spacing.sm }} />
        <AppGradientButton label="Save template" onPress={create} disabled={!name.trim()} colors={['#A78BC9', '#453569']} />
      </HeroCard>
      <FlatList
        data={templates}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <HeroCard
            onPress={() => navigation.navigate('MeditationPlayer', { meditationId: null, type: item.type, durationSeconds: item.durationSeconds })}
            style={{ marginBottom: theme.spacing.sm }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <AppText variant="headingSmall" color="#FFFFFF">
                {item.name}
              </AppText>
              <AppText variant="bodySmall" color="rgba(255,255,255,0.6)">
                {Math.round(item.durationSeconds / 60)} min
              </AppText>
            </View>
          </HeroCard>
        )}
        ListEmptyComponent={
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
              <AppIcon name="bookmark-outline" size={30} color="rgba(255,255,255,0.5)" />
            </View>
            <AppText variant="headingSmall" color="#FFFFFF" align="center">
              No templates yet
            </AppText>
            <AppText variant="bodyMedium" color="rgba(255,255,255,0.6)" align="center" style={{ marginTop: theme.spacing.xxs }}>
              Save a personal meditation configuration to reuse it in one tap.
            </AppText>
          </View>
        }
      />
    </TabHeroLayout>
  );
};
