import { apiClient } from './client';
import type { User } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const startGoogleLogin = () => {
  window.location.href = `${BASE_URL}/auth/google`;
};

export const getMe = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
};

export const logout = async () => {
  await apiClient.post('/auth/logout');
  localStorage.removeItem('access_token');
};
