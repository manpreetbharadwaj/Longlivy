import { registerRootComponent } from 'expo';
import App from './App';
// Defines the background location + notification-response tasks at module
// scope, as `expo-task-manager`/`expo-notifications` require, so Android can
// dispatch them to a headless JS context even when no screen ever mounted
// this session (e.g. after the OS restarts the app process to deliver a
// location update while LongLivy was fully backgrounded).
import './src/features/activity/services/BackgroundLocationTask';
import './src/features/activity/services/WorkoutNotificationActions';

registerRootComponent(App);
