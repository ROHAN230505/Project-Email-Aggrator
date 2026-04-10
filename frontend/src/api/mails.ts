import { apiClient } from './client';
import type { Mail, MailListResponse, MailStats } from '../types';

export const listMails = async (
  q = 'in:inbox',
  maxResults = 100,
  pageToken?: string
): Promise<MailListResponse> => {
  const { data } = await apiClient.get<MailListResponse>('/mails', {
    params: { q, max_results: maxResults, page_token: pageToken },
  });
  return data;
};

export const getMail = async (id: string): Promise<Mail> => {
  const { data } = await apiClient.get<Mail>(`/mails/${id}`);
  return data;
};

export const getThread = async (threadId: string): Promise<Mail[]> => {
  const { data } = await apiClient.get<Mail[]>(`/mails/thread/${threadId}`);
  return data;
};

export const getStats = async (): Promise<MailStats> => {
  const { data } = await apiClient.get<MailStats>('/mails/stats');
  return data;
};

export const sendMail = async (payload: {
  to: string;
  subject: string;
  body: string;
  reply_to_message_id?: string;
}) => {
  const { data } = await apiClient.post('/mails/send', payload);
  return data;
};

