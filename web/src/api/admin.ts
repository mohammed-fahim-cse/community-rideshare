import { apiRequest } from './client';
import type {
  AdminMember,
  AdminReport,
  AdminRide,
  Community,
  ReportAction,
  ReportStatus,
  RidePostStatus,
  UserStatus,
} from './types';

export function listMembers(token: string, status?: UserStatus): Promise<AdminMember[]> {
  const qs = status ? `?status=${status}` : '';
  return apiRequest(`/admin/members${qs}`, { token });
}

export function approveMember(token: string, memberId: string): Promise<AdminMember> {
  return apiRequest(`/admin/members/${memberId}/approve`, { method: 'POST', token });
}

export function listReports(token: string, status?: ReportStatus): Promise<AdminReport[]> {
  const qs = status ? `?status=${status}` : '';
  return apiRequest(`/admin/reports${qs}`, { token });
}

export function actionReport(token: string, reportId: string, action: ReportAction): Promise<AdminReport> {
  return apiRequest(`/admin/reports/${reportId}/action`, { method: 'POST', body: { action }, token });
}

export interface ListAdminRidesParams {
  status?: RidePostStatus;
  from?: string;
  to?: string;
}

export function listRides(token: string, params: ListAdminRidesParams = {}): Promise<AdminRide[]> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.from) query.set('from', params.from);
  if (params.to) query.set('to', params.to);
  const qs = query.toString();
  return apiRequest(`/admin/rides${qs ? `?${qs}` : ''}`, { token });
}

export function getCommunity(token: string): Promise<Community> {
  return apiRequest('/admin/community', { token });
}

export interface UpdateCommunityInput {
  name?: string;
  autoApprove?: boolean;
  matchingRadiusKm?: number;
}

export function updateCommunity(token: string, input: UpdateCommunityInput): Promise<Community> {
  return apiRequest('/admin/community', { method: 'PATCH', body: input, token });
}
