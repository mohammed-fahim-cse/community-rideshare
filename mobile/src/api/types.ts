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
