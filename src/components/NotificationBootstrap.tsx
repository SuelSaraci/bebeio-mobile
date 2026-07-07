import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { MainTabParamList } from '../navigation/types';

type Props = {
  navigationRef: NavigationContainerRefWithCurrent<MainTabParamList>;
};

export function NotificationBootstrap({ navigationRef }: Props) {
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const navigateFromNotification = (screen?: string) => {
      if (!screen || !navigationRef.isReady()) return;
      if (
        screen === 'Home' ||
        screen === 'Feeding' ||
        screen === 'Sleep' ||
        screen === 'Growth' ||
        screen === 'Health' ||
        screen === 'AI'
      ) {
        navigationRef.navigate(screen);
      }
    };

    const handleResponse = (response: Notifications.NotificationResponse) => {
      const id = response.notification.request.identifier;
      if (handledRef.current === id) return;
      handledRef.current = id;
      const screen = response.notification.request.content.data?.screen as string | undefined;
      navigateFromNotification(screen);
    };

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) handleResponse(response);
    });

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, [navigationRef]);

  return null;
}
