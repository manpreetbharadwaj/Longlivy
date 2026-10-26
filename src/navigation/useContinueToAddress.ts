import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { useAppSelector } from '@/store/hooks';
import { selectIsAuthenticated } from '@/features/auth/selectors';

/**
 * Login/Register stay mounted when sign-in succeeds for an account without an
 * address (RootNavigator keeps the Auth stack until one is saved), and the
 * stack's `initialRouteName` only applies on mount — so move on explicitly.
 */
export function useContinueToAddress(): void {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (isAuthenticated) navigation.reset({ index: 0, routes: [{ name: 'Address' }] });
  }, [isAuthenticated, navigation]);
}
