import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export type PredictionRequest = {
  symptoms: string[];
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
};

export const fetchSymptoms = async (): Promise<string[]> => {
  const response = await axios.get<{ symptoms: string[] }>(`${API_BASE_URL}/symptoms`);
  return response.data.symptoms;
};

export const requestPrediction = async (payload: PredictionRequest): Promise<PredictionResponse> => {
  const response = await axios.post<PredictionResponse>(`${API_BASE_URL}/predict`, payload);
  return response.data;
};
