export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type UserRole = 'MEMBER' | 'ADMIN';
export type RidePostStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type RidePostType = 'REQUEST' | 'OFFER';
export type RideMode = 'ON_DEMAND' | 'SCHEDULED';
export type ReportStatus = 'OPEN' | 'REVIEWED' | 'ACTIONED';
export type ReportAction = 'WARN' | 'SUSPEND' | 'REMOVE' | 'DISMISS';

export interface Me {
  id: string;
  name: string | null;
  phone: string;
  photoUrl: string | null;
  phoneVisible: boolean;
  communityId: string;
  ratingAvg: number;
  ratingCount: number;
  status: UserStatus;
  role: UserRole;
  createdAt: string;
}

export interface VerifyOtpResponse {
  accessToken: string;
  user: {
    id: string;
    phone: string;
    name: string | null;
    status: UserStatus;
    communityId: string;
  };
}

// GET /admin/members returns full user rows.
export type AdminMember = Me;

interface AdminUserSummary {
  id: string;
  name: string | null;
  phone: string;
}

export interface AdminReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  rideMatchId: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: AdminUserSummary;
  reportedUser: AdminUserSummary & { status: UserStatus };
}

export interface AdminRideMatch {
  id: string;
  ridePostId: string;
  acceptedByUserId: string;
  acceptedAt: string;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  acceptedBy: AdminUserSummary;
}

export interface AdminRide {
  id: string;
  type: RidePostType;
  mode: RideMode;
  creatorId: string;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  scheduledTime: string | null;
  seatsAvailable: number | null;
  suggestedFare: number | null;
  status: RidePostStatus;
  createdAt: string;
  creator: AdminUserSummary;
  match: AdminRideMatch | null;
}

export interface Community {
  id: string;
  name: string;
  inviteCode: string;
  autoApprove: boolean;
  matchingRadiusKm: number;
  createdAt: string;
}
