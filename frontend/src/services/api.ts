import {
  User,
  Exercise,
  WorkoutProgram,
  WorkoutSession,
  WorkoutSet,
  AnalyticsStats,
  GenerateProgramParams,
} from '../types';

const API_BASE = '/api';

const getHeaders = (): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const tgInitData = window.Telegram?.WebApp?.initData;
  if (tgInitData) {
    headers['X-Telegram-Init-Data'] = tgInitData;
  } else {
    // Development fallback
    const devUserId = localStorage.getItem('gym_dev_user_id') || '999999999';
    headers['X-Telegram-User-Id'] = devUserId;
  }

  return headers;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = 'Ошибка сети';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // Keep default
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

// Auth & User API
export const authApi = {
  getMe: () => request<User>('/auth/me'),
  updateProfile: (data: Partial<User>) =>
    request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Exercises API
export const exercisesApi = {
  list: (params?: { category?: string; equipment?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.category) q.append('category', params.category);
    if (params?.equipment) q.append('equipment', params.equipment);
    if (params?.search) q.append('search', params.search);
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<Exercise[]>(`/exercises${queryStr}`);
  },
  create: (data: Partial<Exercise>) =>
    request<Exercise>('/exercises', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Programs API
export const programsApi = {
  list: () => request<WorkoutProgram[]>('/programs'),
  get: (id: number) => request<WorkoutProgram>(`/programs/${id}`),
  generate: (params: GenerateProgramParams) =>
    request<WorkoutProgram>('/programs/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    }),
  activate: (id: number) =>
    request<{ status: string; message: string }>(`/programs/${id}/activate`, {
      method: 'POST',
    }),
  importFromText: (text: string) =>
    request<WorkoutProgram>('/programs/import', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
};

// Workouts API
export const workoutsApi = {
  getActive: () => request<WorkoutSession | null>('/workouts/active'),
  start: (name?: string, programDayId?: number) =>
    request<WorkoutSession>('/workouts/start', {
      method: 'POST',
      body: JSON.stringify({ name, program_day_id: programDayId }),
    }),
  logSet: (
    sessionId: number,
    data: { exercise_id: number; set_number: number; weight_kg: number; reps: number; is_completed?: boolean }
  ) =>
    request<WorkoutSet>(`/workouts/${sessionId}/sets`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteSet: (setId: number) =>
    request<{ status: string; deleted_set_id: number }>(`/workouts/sets/${setId}`, {
      method: 'DELETE',
    }),
  finish: (sessionId: number, durationSeconds: number, totalVolumeKg: number, notes?: string) =>
    request<WorkoutSession>(`/workouts/${sessionId}/finish`, {
      method: 'POST',
      body: JSON.stringify({ duration_seconds: durationSeconds, total_volume_kg: totalVolumeKg, notes }),
    }),
  cancel: (sessionId: number) =>
    request<{ status: string; message: string }>(`/workouts/${sessionId}/cancel`, {
      method: 'POST',
    }),
  getHistory: () => request<WorkoutSession[]>('/workouts/history'),
  getLastPerformance: (exerciseId: number) =>
    request<WorkoutSet[]>(`/workouts/last-performance/${exerciseId}`),
};

// Analytics API
export const analyticsApi = {
  get: () => request<AnalyticsStats>('/analytics'),
};
