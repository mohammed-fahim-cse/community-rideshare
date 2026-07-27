import { User } from '@prisma/client';

export interface PublicUser {
  id: string;
  name: string | null;
  photoUrl: string | null;
  phone: string | null;
  ratingAvg: number;
  ratingCount: number;
}

// Phone numbers are hidden until a ride is accepted (or the user opted into public visibility);
// only first name + photo are shown otherwise. Centralized here since this rule applies
// wherever a user is exposed to another member (public profile, ride post participants).
export function toPublicUser(user: User, revealPhone = false): PublicUser {
  return {
    id: user.id,
    name: user.name?.split(' ')[0] ?? null,
    photoUrl: user.photoUrl,
    phone: revealPhone || user.phoneVisible ? user.phone : null,
    ratingAvg: user.ratingAvg,
    ratingCount: user.ratingCount,
  };
}
