import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

type ToastType = 'error' | 'success';

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('error');
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 16, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const show = useCallback(
    (text: string, toastType: ToastType) => {
      if (timer.current) clearTimeout(timer.current);
      setMessage(text);
      setType(toastType);
      setVisible(true);
      opacity.setValue(0);
      translateY.setValue(16);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      timer.current = setTimeout(hide, 3500);
    },
    [hide, opacity, translateY],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showError: (text) => show(text, 'error'),
        showSuccess: (text) => show(text, 'success'),
      }}
    >
      {children}
      {visible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.snackbar,
            type === 'error' ? styles.error : styles.success,
            { bottom: insets.bottom + 24, opacity, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.text}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  snackbar: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 9999,
  },
  error: {
    backgroundColor: colors.red500,
  },
  success: {
    backgroundColor: colors.primary,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
