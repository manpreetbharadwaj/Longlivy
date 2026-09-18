import React, { useEffect } from 'react';
import { Modal, Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { motion } from '@/theme/motion';
import { AppText } from './AppText';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Accent used for the confirm button and card border — pass the caller's own section color (e.g. the dashboard blue) so the dialog matches whichever hero screen it's presented over. Defaults to the app-wide primary. */
  accentColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A themed replacement for `Alert.alert` — a native OS alert would clash
 * with the app's dark hero surfaces (white background, system font), so
 * every "are you sure?" moment on those screens should go through this
 * instead. Fades and scales in/out rather than snapping.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ visible, title, message, confirmLabel, cancelLabel, accentColor, onConfirm, onCancel }) => {
  const { theme } = useTheme();
  const accent = accentColor ?? theme.colors.primary;
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: motion.duration.base, easing: motion.easing.decelerate });
  }, [visible, progress]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.08 }],
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[{ flex: 1, backgroundColor: theme.colors.overlay, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg }, backdropStyle]}>
        <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={onCancel} accessibilityLabel={cancelLabel} accessibilityRole="button" />
        <Animated.View
          style={[
            {
              width: '100%',
              maxWidth: 340,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              backgroundColor: 'rgba(24,20,16,0.96)',
              borderWidth: 1.5,
              borderColor: accent + '3D',
            },
            cardStyle,
          ]}
        >
          <AppText variant="headingMedium" color="#FFFFFF" align="center">
            {title}
          </AppText>
          <AppText variant="bodyMedium" color="rgba(255,255,255,0.65)" align="center" style={{ marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }}>
            {message}
          </AppText>
          <DialogButton label={confirmLabel} onPress={onConfirm} tone="outline" accentColor={accent} />
          <DialogButton label={cancelLabel} onPress={onCancel} tone="filled" accentColor={accent} style={{ marginTop: theme.spacing.sm }} />
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const DialogButton: React.FC<{ label: string; onPress: () => void; tone: 'filled' | 'outline'; accentColor: string; style?: ViewStyle }> = React.memo(
  ({ label, onPress, tone, accentColor, style }) => {
    const { theme } = useTheme();
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.97, { duration: motion.duration.fast, easing: Easing.out(Easing.ease) });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.duration.fast });
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View
          style={[
            {
              height: theme.componentSizes.buttonHeight,
              borderRadius: theme.radius.md,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tone === 'filled' ? accentColor : 'transparent',
              borderWidth: tone === 'outline' ? 1.5 : 0,
              borderColor: 'rgba(255,255,255,0.2)',
            },
            style,
            animatedStyle,
          ]}
        >
          <AppText variant="headingSmall" color="#FFFFFF">
            {label}
          </AppText>
        </Animated.View>
      </Pressable>
    );
  }
);
DialogButton.displayName = 'DialogButton';
