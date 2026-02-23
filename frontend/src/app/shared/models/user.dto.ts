export type UserRole = 'ROLE_USER' | 'ROLE_MODERATOR' | 'ROLE_ADMIN';

export interface UserSummaryDto {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface UserProfileDto extends UserSummaryDto {
  email: string;
  bio: string | null;
  trailsHiked: number;
  favoriteCount: number;
  reviewCount: number;
  joinedAt: string;    // ISO-8601
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;   // seconds
  user: UserSummaryDto;
  roles: UserRole[];
}

export interface UpdateProfileRequestDto {
  username?: string;
  bio?: string;
  avatarUrl?: string;
}
