import { apiRequest } from './client';

export interface CreateReportInput {
  reportedUserId: string;
  reason: string;
}

export function createReport(token: string, input: CreateReportInput): Promise<{ id: string }> {
  return apiRequest('/reports', { method: 'POST', body: input, token });
}
