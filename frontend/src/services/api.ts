import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const client = axios.create({ baseURL: API_BASE_URL });

export const setAuthToken = (token?: string) => {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
};

export type PredictionRequest = {
  symptoms: string[];
  symptom_details?: SymptomDetail[];
};

export type SymptomDetail = {
  name: string;
  duration?: string | null;
  severity?: number | null;
};

export type PredictionResult = {
  disease: string;
  probability: number;
  severity_score: number;
  triage_level: string;
  precautions: string[];
  description?: string | null;
};

export type PredictionResponse = {
  results: PredictionResult[];
  normalized_symptoms: string[];
  unmapped_symptoms: string[];
  red_flags: string[];
  follow_up_questions: string[];
};

export type TimelineEntry = {
  id: string;
  symptoms: string[];
  notes?: string | null;
  occurred_at: string;
  top_prediction?: string | null;
  triage_level?: string | null;
  severity_score?: number | null;
  symptom_severity?: Record<string, number> | null;
  user_id?: string | null;
  entry_type?: 'case' | 'tracker';
};

export type CreateTimelinePayload = {
  symptoms: string[];
  notes?: string;
  occurred_at?: string;
  top_prediction?: string;
  triage_level?: string;
  severity_score?: number;
  symptom_severity?: Record<string, number>;
  entry_type?: 'case' | 'tracker';
};

export type PrivacySummary = {
  timeline_entries: number;
  stored_categories: string[];
  has_data: boolean;
  last_entry_at?: string | null;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type AuthResponse = {
  token: string;
  user: UserProfile;
};

export type SignupRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export const fetchSymptoms = async (): Promise<string[]> => {
  const response = await client.get<{ symptoms: string[] }>('/symptoms');
  return response.data.symptoms;
};

export const requestPrediction = async (payload: PredictionRequest): Promise<PredictionResponse> => {
  const response = await client.post<PredictionResponse>('/predict', payload);
  return response.data;
};

export const fetchTimeline = async (): Promise<TimelineEntry[]> => {
  const response = await client.get<TimelineEntry[]>('/timeline');
  return response.data;
};

export const createTimelineEntry = async (payload: CreateTimelinePayload): Promise<TimelineEntry> => {
  const response = await client.post<TimelineEntry>('/timeline', payload);
  return response.data;
};

export const deleteTimelineEntry = async (entryId: string): Promise<void> => {
  await client.delete(`/timeline/${entryId}`);
};

export const fetchPrivacySummary = async (): Promise<PrivacySummary> => {
  const response = await client.get<PrivacySummary>('/privacy/summary');
  return response.data;
};

export const clearTimeline = async (): Promise<void> => {
  await client.delete('/privacy/timeline');
};

export const signup = async (payload: SignupRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/auth/signup', payload);
  return response.data;
};

export const login = async (payload: LoginRequest): Promise<AuthResponse> => {
  const response = await client.post<AuthResponse>('/auth/login', payload);
  return response.data;
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const response = await client.get<UserProfile>('/auth/me');
  return response.data;
};
