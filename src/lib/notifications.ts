import { Platform, AppState, type AppStateStatus } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  parseISO,
  format,
  subHours,
  addHours,
  addMinutes,
  isAfter,
  isBefore,
  startOfDay,
  differenceInHours,
} from 'date-fns';
import type {
  Appointment,
  BabyProfile,
  DiaperEntry,
  FeedingEntry,
  SleepEntry,
  Vaccination,
} from '../types';
import { api } from './api';
import { pickNotificationMessage } from './notificationMessages';

const PREFS_KEY = '@bebio/notifications/enabled';
const PROMPTED_KEY = '@bebio/notifications/prompted';

export type NotificationPrefs = {
  enabled: boolean;
  feedingReminders: boolean;
  diaperReminders: boolean;
  sleepReminders: boolean;
  eveningCheckIn: boolean;
  healthReminders: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: true,
  feedingReminders: true,
  diaperReminders: true,
  sleepReminders: false,
  eveningCheckIn: false,
  healthReminders: false,
};

const QUIET_START = 22; // 10 PM
const QUIET_END = 7; // 7 AM
const NAP_AWAKE_HOURS = 2;

export type NotificationScheduleInput = {
  baby: BabyProfile;
  vaccinations: Vaccination[];
  appointments: Appointment[];
  feedings?: FeedingEntry[];
  sleepEntries?: SleepEntry[];
  diapers?: DiaperEntry[];
  prefs?: NotificationPrefs;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      enabled: parsed.enabled ?? DEFAULT_PREFS.enabled,
      feedingReminders: parsed.feedingReminders ?? DEFAULT_PREFS.feedingReminders,
      diaperReminders: parsed.diaperReminders ?? DEFAULT_PREFS.diaperReminders,
      sleepReminders: false,
      eveningCheckIn: false,
      healthReminders: false,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function setNotificationPrefs(prefs: NotificationPrefs) {
  await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  try {
    await api.updateNotificationPreferences({
      enabled: prefs.enabled,
      feedingReminders: prefs.feedingReminders,
      eveningCheckIn: prefs.eveningCheckIn,
      healthReminders: prefs.healthReminders,
    });
  } catch {
    // Local prefs still apply if API sync fails.
  }
}

export async function wasNotificationPromptShown() {
  return (await AsyncStorage.getItem(PROMPTED_KEY)) === '1';
}

export async function markNotificationPromptShown() {
  await AsyncStorage.setItem(PROMPTED_KEY, '1');
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('[notifications] Missing EAS projectId — remote push token skipped.');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.warn('[notifications] Failed to get push token:', error);
    return null;
  }
}

export async function registerPushTokenWithApi() {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await api.registerPushToken({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
  } catch (error) {
    console.warn('[notifications] Failed to register push token:', error);
  }
}

export async function unregisterPushTokenFromApi() {
  try {
    await api.deletePushToken();
  } catch {
    // Ignore if already removed.
  }
}

async function ensureAndroidChannels() {
  if (Platform.OS !== 'android') return;
  const channels = [
    { id: 'feeding', name: 'Feeding reminders' },
    { id: 'diaper', name: 'Diaper reminders' },
    { id: 'sleep', name: 'Sleep & nap reminders' },
    { id: 'health', name: 'Health & vaccines' },
    { id: 'default', name: 'Bebio reminders' },
  ];
  for (const ch of channels) {
    await Notifications.setNotificationChannelAsync(ch.id, {
      name: ch.name,
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D95C74',
    });
  }
}

async function cancelAllScheduled() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function clearScheduledNotifications() {
  await cancelAllScheduled();
}

function dailyTrigger(hour: number, minute: number) {
  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY as const,
    hour,
    minute,
  };
}

function dateTrigger(date: Date) {
  if (!isAfter(date, new Date())) return null;
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE as const,
    date,
  };
}

function isQuietHour(date: Date): boolean {
  const h = date.getHours();
  return h >= QUIET_START || h < QUIET_END;
}

function latestSleepEnd(entries: SleepEntry[]): Date | null {
  let latest: Date | null = null;
  for (const e of entries) {
    if (!e.end) continue;
    try {
      const d = parseISO(e.end);
      if (!latest || d > latest) latest = d;
    } catch {
      // skip invalid
    }
  }
  return latest;
}

async function scheduleOne(input: {
  identifier: string;
  title: string;
  body: string;
  screen: string;
  trigger: Notifications.NotificationTriggerInput;
  channelId?: string;
}) {
  await Notifications.scheduleNotificationAsync({
    identifier: input.identifier,
    content: {
      title: input.title,
      body: input.body,
      sound: true,
      data: { screen: input.screen },
      ...(Platform.OS === 'android' && input.channelId
        ? { channelId: input.channelId }
        : {}),
    },
    trigger: input.trigger,
  });
}

export async function scheduleBabyNotifications(input: NotificationScheduleInput) {
  const prefs = input.prefs ?? (await getNotificationPrefs());
  if (!prefs.enabled) {
    await cancelAllScheduled();
    return;
  }

  await ensureAndroidChannels();
  await cancelAllScheduled();

  const { baby, vaccinations, appointments } = input;
  const sleepEntries = input.sleepEntries ?? [];
  const name = baby.name;

  if (prefs.feedingReminders) {
    const slots = [
      { id: 'feeding-morning', hour: 10, minute: 30, salt: 0 },
      { id: 'feeding-afternoon', hour: 15, minute: 0, salt: 1 },
      { id: 'feeding-evening', hour: 20, minute: 0, salt: 2 },
    ];
    for (const slot of slots) {
      const msg = pickNotificationMessage('feeding', name, undefined, slot.salt);
      await scheduleOne({
        identifier: slot.id,
        ...msg,
        screen: 'Feeding',
        trigger: dailyTrigger(slot.hour, slot.minute),
        channelId: 'feeding',
      });
    }
  }

  if (prefs.diaperReminders) {
    const slots = [
      { id: 'diaper-midday', hour: 12, minute: 0, salt: 0 },
      { id: 'diaper-afternoon', hour: 16, minute: 30, salt: 1 },
    ];
    for (const slot of slots) {
      const msg = pickNotificationMessage('diaper', name, undefined, slot.salt);
      await scheduleOne({
        identifier: slot.id,
        ...msg,
        screen: 'Home',
        trigger: dailyTrigger(slot.hour, slot.minute),
        channelId: 'diaper',
      });
    }
  }

  if (prefs.sleepReminders) {
    const napSlots = [
      { id: 'nap-morning', hour: 10, minute: 0, salt: 0 },
      { id: 'nap-afternoon', hour: 14, minute: 0, salt: 1 },
      { id: 'nap-late', hour: 16, minute: 30, salt: 2 },
    ];
    for (const slot of napSlots) {
      const msg = pickNotificationMessage('sleep', name, undefined, slot.salt);
      await scheduleOne({
        identifier: slot.id,
        ...msg,
        screen: 'Sleep',
        trigger: dailyTrigger(slot.hour, slot.minute),
        channelId: 'sleep',
      });
    }

    const lastSleepEnd = latestSleepEnd(sleepEntries);
    if (lastSleepEnd) {
      const awakeHours = differenceInHours(new Date(), lastSleepEnd);
      if (awakeHours >= NAP_AWAKE_HOURS && !isQuietHour(new Date())) {
        const napNudge = addMinutes(new Date(), 20);
        const napTrigger = dateTrigger(napNudge);
        if (napTrigger) {
          const msg = pickNotificationMessage('sleep', name, undefined, 5);
          await scheduleOne({
            identifier: 'nap-awake-nudge',
            ...msg,
            screen: 'Sleep',
            trigger: napTrigger,
            channelId: 'sleep',
          });
        }
      }
    }
  }

  if (prefs.eveningCheckIn) {
    const msg = pickNotificationMessage('evening', name, undefined, 0);
    await scheduleOne({
      identifier: 'evening-checkin',
      ...msg,
      screen: 'Home',
      trigger: dailyTrigger(19, 30),
      channelId: 'default',
    });
  }

  if (prefs.healthReminders) {
    const today = startOfDay(new Date());

    for (const vax of vaccinations) {
      if (vax.done) continue;
      let due: Date;
      try {
        due = startOfDay(parseISO(vax.scheduledDate));
      } catch {
        continue;
      }
      if (isBefore(due, today)) continue;

      const dayBefore = addHours(due, -24);
      dayBefore.setHours(9, 0, 0, 0);
      const morningOf = new Date(due);
      morningOf.setHours(8, 30, 0, 0);

      for (const [suffix, when] of [
        ['daybefore', dayBefore],
        ['dayof', morningOf],
      ] as const) {
        const trigger = dateTrigger(when);
        if (!trigger) continue;
        const detail = `${vax.name} on ${format(due, 'MMM d')}`;
        const msg = pickNotificationMessage('vaccine', name, detail, suffix === 'daybefore' ? 0 : 1);
        await scheduleOne({
          identifier: `vax-${suffix}-${vax.id}`,
          ...msg,
          screen: 'Health',
          trigger,
          channelId: 'health',
        });
      }
    }

    for (const apt of appointments) {
      if (apt.done) continue;
      let aptDate: Date;
      try {
        aptDate = parseISO(apt.date);
      } catch {
        continue;
      }

      const [hours, minutes] = apt.time.split(':').map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

      const aptDateTime = new Date(aptDate);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const dayBefore = subHours(aptDateTime, 24);
      const hourBefore = subHours(aptDateTime, 1);

      const dayBeforeTrigger = dateTrigger(dayBefore);
      if (dayBeforeTrigger) {
        const detail = `${apt.type} with ${apt.doctor} tomorrow at ${apt.time}`;
        const msg = pickNotificationMessage('appointment', name, detail, 0);
        await scheduleOne({
          identifier: `apt-day-${apt.id}`,
          ...msg,
          screen: 'Health',
          trigger: dayBeforeTrigger,
          channelId: 'health',
        });
      }

      const hourBeforeTrigger = dateTrigger(hourBefore);
      if (hourBeforeTrigger) {
        const detail = `${apt.type} at ${apt.time} with ${apt.doctor}`;
        const msg = pickNotificationMessage('appointment', name, detail, 1);
        await scheduleOne({
          identifier: `apt-hour-${apt.id}`,
          ...msg,
          screen: 'Health',
          trigger: hourBeforeTrigger,
          channelId: 'health',
        });
      }
    }
  }
}

export async function setupNotificationsForUser(input: NotificationScheduleInput) {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  await markNotificationPromptShown();
  await registerPushTokenWithApi();
  await scheduleBabyNotifications(input);
  return true;
}

export async function refreshNotificationSchedule(input: NotificationScheduleInput) {
  const prefs = await getNotificationPrefs();
  if (!prefs.enabled) return;
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;
  await registerPushTokenWithApi();
  await scheduleBabyNotifications({ ...input, prefs });
}

let appStateSubscription: { remove: () => void } | null = null;
let pendingRefresh: NotificationScheduleInput | null = null;

export function bindNotificationRefresh(getInput: () => NotificationScheduleInput | null) {
  if (appStateSubscription) return;

  const refresh = () => {
    const input = getInput();
    if (!input) return;
    pendingRefresh = input;
    void refreshNotificationSchedule(input);
  };

  appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
    if (state === 'active') refresh();
  });
}

export function triggerNotificationRefresh(input: NotificationScheduleInput) {
  pendingRefresh = input;
  void refreshNotificationSchedule(input);
}

export function unbindNotificationRefresh() {
  appStateSubscription?.remove();
  appStateSubscription = null;
  pendingRefresh = null;
}
