export type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';
export type UserRole = 'MEMBER' | 'ADMIN';

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

export type RidePostType = 'REQUEST' | 'OFFER';
export type RideMode = 'ON_DEMAND' | 'SCHEDULED';
export type RidePostStatus = 'OPEN' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface PublicUser {
  id: string;
  name: string | null;
  photoUrl: string | null;
  phone: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface RideMatch {
  id: string;
  acceptedAt: string;
  arrivedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  acceptedBy: PublicUser;
}

export interface RidePost {
  id: string;
  type: RidePostType;
  mode: RideMode;
  status: RidePostStatus;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  scheduledTime: string | null;
  seatsAvailable: number | null;
  suggestedFare: number | null;
  createdAt: string;
  creator: PublicUser;
  match: RideMatch | null;
}

export interface CreateRidePostInput {
  type: RidePostType;
  mode: RideMode;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  scheduledTime?: string;
  seatsAvailable?: number;
  suggestedFare?: number;
}

export interface RideHistoryItem extends RidePost {
  myRating: number | null;
  theirRating: number | null;
}

export interface ChatMessage {
  id: string;
  rideMatchId: string;
  senderId: string;
  text: string;
  sentAt: string;
}

export interface Rating {
  id: string;
  rideMatchId: string;
  raterId: string;
  ratedUserId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
}
