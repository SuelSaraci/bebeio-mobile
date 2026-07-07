import { Platform } from 'react-native';

/** KeyboardAvoidingView behavior that works on both iOS and Android. */
export const keyboardAvoidingBehavior =
  Platform.OS === 'ios' ? ('padding' as const) : ('height' as const);
