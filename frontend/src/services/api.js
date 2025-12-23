import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const client = axios.create({ baseURL: API_BASE_URL });
export const setAuthToken = (token) => {
    if (token) {
        client.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
    else {
        delete client.defaults.headers.common.Authorization;
    }
};
export const fetchSymptoms = async () => {
    const response = await client.get('/symptoms');
    return response.data.symptoms;
};
export const requestPrediction = async (payload) => {
    const response = await client.post('/predict', payload);
    return response.data;
};
export const fetchTimeline = async () => {
    const response = await client.get('/timeline');
    return response.data;
};
export const createTimelineEntry = async (payload) => {
    const response = await client.post('/timeline', payload);
    return response.data;
};
export const deleteTimelineEntry = async (entryId) => {
    await client.delete(`/timeline/${entryId}`);
};
export const fetchPrivacySummary = async () => {
    const response = await client.get('/privacy/summary');
    return response.data;
};
export const clearTimeline = async () => {
    await client.delete('/privacy/timeline');
};
export const signup = async (payload) => {
    const response = await client.post('/auth/signup', payload);
    return response.data;
};
export const login = async (payload) => {
    const response = await client.post('/auth/login', payload);
    return response.data;
};
export const fetchCurrentUser = async () => {
    const response = await client.get('/auth/me');
    return response.data;
};
