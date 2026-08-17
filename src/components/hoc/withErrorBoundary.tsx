import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/common/AppText';
import { AppButton } from '@/components/common/AppButton';

interface ErrorBoundaryState {
  error: Error | null;
}

class FeatureErrorBoundary extends React.Component<{ children: React.ReactNode; label?: string }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    // A real app would forward this to an analytics/crash-reporting service.
    console.warn(`[Longlivy] ${this.props.label ?? 'Feature'} crashed:`, error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <AppText variant="headingSmall" align="center">
            This section hit a snag
          </AppText>
          <AppText variant="bodyMedium" align="center" style={{ marginVertical: 12 }}>
            {this.props.label ? `${this.props.label} ` : ''}couldn't load. The rest of the app is unaffected.
          </AppText>
          <AppButton label="Try again" onPress={this.reset} fullWidth={false} variant="outline" />
        </View>
      );
    }
    return this.props.children;
  }
}

/**
 * Wraps a feature screen so a crash in one module never takes down the
 * whole app.
 */
export function withErrorBoundary<P extends object>(Component: React.ComponentType<P>, label?: string) {
  const Wrapped: React.FC<P> = (props) => (
    <FeatureErrorBoundary label={label}>
      <Component {...props} />
    </FeatureErrorBoundary>
  );
  Wrapped.displayName = `withErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`;
  return Wrapped;
}
