import { getAuth } from "firebase/auth";
import { logger } from "./logger";
import type {
  Appointment,
  BabyProfile,
  DiaperEntry,
  FeedingEntry,
  GrowthEntry,
  MedicalNote,
  Milestone,
  SleepEntry,
  Vaccination,
} from "../types";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5002";

export const getApiBaseUrl = () => API_URL;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function isFreeLimitError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.code === "FREE_LIMIT_REACHED" || error.status === 403)
  );
}

async function getToken(): Promise<string> {
  const user = getAuth().currentUser;
  if (!user) throw new ApiError("Not authenticated", 401);
  return user.getIdToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${API_URL}${path}`;
  const isFeeding = path.startsWith("/api/feedings");

  if (isFeeding) {
    logger.api(
      `${method} ${url}`,
      options.body ? JSON.parse(String(options.body)) : undefined,
    );
  }

  let token: string;
  try {
    token = await getToken();
  } catch (error) {
    logger.error("api", "getToken failed", error);
    throw error;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string>),
      },
    });
  } catch (error) {
    logger.error("api", `${method} ${path} network error (url=${url})`, error);
    throw error;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    logger.error("api", `${method} ${path} HTTP ${res.status}`, body);
    throw new ApiError(
      body.error || `Request failed (${res.status})`,
      res.status,
      typeof body.code === "string" ? body.code : undefined,
    );
  }

  if (res.status === 204) {
    if (isFeeding) logger.api(`${method} ${path} OK (204)`);
    return undefined as T;
  }

  const data = (await res.json()) as T;
  if (isFeeding) logger.api(`${method} ${path} OK`, data);
  return data;
}

export const api = {
  verify: () =>
    request<{
      user: { id: number; firebase_uid: string; email: string | null };
    }>("/api/auth/verify"),

  getProfile: () =>
    request<{
      profile: { name: string; has_completed_onboarding: boolean } | null;
    }>("/api/profile"),

  updateProfile: (data: {
    name?: string;
    has_completed_onboarding?: boolean;
  }) =>
    request<{ success: boolean }>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getBaby: () => request<{ baby: BabyProfile | null }>("/api/baby"),

  putBaby: (baby: Omit<BabyProfile, "id">) =>
    request<{ baby: BabyProfile }>("/api/baby", {
      method: "PUT",
      body: JSON.stringify(baby),
    }),

  getFeedings: () => request<{ entries: FeedingEntry[] }>("/api/feedings"),
  postFeeding: (entry: Omit<FeedingEntry, "id">) =>
    request<{ entry: FeedingEntry }>("/api/feedings", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  deleteFeeding: (id: string) =>
    request<{ success: boolean }>(`/api/feedings/${id}`, { method: "DELETE" }),

  getSleep: () => request<{ entries: SleepEntry[] }>("/api/sleep"),
  postSleep: (entry: Omit<SleepEntry, "id">) =>
    request<{ entry: SleepEntry }>("/api/sleep", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  deleteSleep: (id: string) =>
    request<{ success: boolean }>(`/api/sleep/${id}`, { method: "DELETE" }),

  getDiapers: () => request<{ entries: DiaperEntry[] }>("/api/diapers"),
  postDiaper: (entry: Omit<DiaperEntry, "id">) =>
    request<{ entry: DiaperEntry }>("/api/diapers", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  deleteDiaper: (id: string) =>
    request<{ success: boolean }>(`/api/diapers/${id}`, { method: "DELETE" }),

  getGrowth: () => request<{ entries: GrowthEntry[] }>("/api/growth"),
  postGrowth: (entry: Omit<GrowthEntry, "id">) =>
    request<{ entry: GrowthEntry }>("/api/growth", {
      method: "POST",
      body: JSON.stringify(entry),
    }),
  deleteGrowth: (id: string) =>
    request<{ success: boolean }>(`/api/growth/${id}`, { method: "DELETE" }),

  getVaccinations: () =>
    request<{ vaccinations: Vaccination[] }>("/api/health/vaccinations"),
  putVaccination: (
    id: string,
    data: { done?: boolean; completedDate?: string },
  ) =>
    request<{ vaccination: Vaccination }>(`/api/health/vaccinations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  bulkVaccinations: (vaccinations: Omit<Vaccination, "id">[]) =>
    request<{ success: boolean }>("/api/health/vaccinations/bulk", {
      method: "POST",
      body: JSON.stringify({ vaccinations }),
    }),

  getAppointments: () =>
    request<{ appointments: Appointment[] }>("/api/health/appointments"),
  putAppointment: (id: string, data: { done?: boolean; completedDate?: string | null }) =>
    request<{ appointment: Appointment }>(`/api/health/appointments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  bulkAppointments: (appointments: Omit<Appointment, "id">[]) =>
    request<{ success: boolean }>("/api/health/appointments/bulk", {
      method: "POST",
      body: JSON.stringify({ appointments }),
    }),

  getMedNotes: () => request<{ notes: MedicalNote[] }>("/api/health/notes"),
  postMedNote: (note: Omit<MedicalNote, "id">) =>
    request<{ note: MedicalNote }>("/api/health/notes", {
      method: "POST",
      body: JSON.stringify(note),
    }),
  putMedNote: (id: string, data: { done?: boolean; completedDate?: string | null }) =>
    request<{ note: MedicalNote }>(`/api/health/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMedNote: (id: string) =>
    request<{ success: boolean }>(`/api/health/notes/${id}`, {
      method: "DELETE",
    }),

  getMilestones: () => request<{ milestones: Milestone[] }>("/api/milestones"),
  postMilestone: (data: Omit<Milestone, "id">) =>
    request<{ milestone: Milestone }>("/api/milestones", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  putMilestone: (id: string, data: { done?: boolean; achievedDate?: string | null }) =>
    request<{ milestone: Milestone }>(`/api/milestones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteMilestone: (id: string) =>
    request<{ success: boolean }>(`/api/milestones/${id}`, { method: "DELETE" }),
  bulkMilestones: (milestones: Omit<Milestone, "id">[]) =>
    request<{ success: boolean }>("/api/milestones/bulk", {
      method: "POST",
      body: JSON.stringify({ milestones }),
    }),

  chatAi: (data: {
    message: string;
    history?: { role: "user" | "assistant"; text: string }[];
  }) =>
    request<{ reply: string }>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerPushToken: (data: { token: string; platform: "ios" | "android" }) =>
    request<{ success: boolean }>("/api/notifications/token", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deletePushToken: () =>
    request<{ success: boolean }>("/api/notifications/token", {
      method: "DELETE",
    }),

  getNotificationPreferences: () =>
    request<{
      preferences: {
        enabled: boolean;
        feedingReminders: boolean;
        eveningCheckIn: boolean;
        healthReminders: boolean;
      };
    }>("/api/notifications/preferences"),

  updateNotificationPreferences: (data: {
    enabled?: boolean;
    feedingReminders?: boolean;
    eveningCheckIn?: boolean;
    healthReminders?: boolean;
  }) =>
    request<{ success: boolean }>("/api/notifications/preferences", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  getSubscriptionStatus: () =>
    request<{
      success: boolean;
      subscription: {
        status: string;
        plan_type: string;
        hasPremium?: boolean;
      };
    }>("/api/subscriptions/status"),

  cancelSubscription: () =>
    request<{
      success: boolean;
      message: string;
    }>("/api/subscriptions/cancel", {
      method: "POST",
    }),

  async loadAllData() {
    const [
      profileRes,
      babyRes,
      feedingsRes,
      sleepRes,
      diapersRes,
      growthRes,
      vaxRes,
      aptRes,
      notesRes,
      msRes,
    ] = await Promise.all([
      api.getProfile(),
      api.getBaby(),
      api.getFeedings(),
      api.getSleep(),
      api.getDiapers(),
      api.getGrowth(),
      api.getVaccinations(),
      api.getAppointments(),
      api.getMedNotes(),
      api.getMilestones(),
    ]);

    return {
      profile: profileRes.profile,
      baby: babyRes.baby,
      feedings: feedingsRes.entries,
      sleepEntries: sleepRes.entries,
      diapers: diapersRes.entries,
      growth: growthRes.entries,
      vaccinations: vaxRes.vaccinations,
      appointments: aptRes.appointments,
      medNotes: notesRes.notes,
      milestones: msRes.milestones,
    };
  },
};
