import { UserSummaryDto } from './user.dto';

export interface ReviewSummaryDto {
  id: string;
  trailId: string;
  author: UserSummaryDto;
  rating: number;        // 1–5
  excerpt: string;       // first 120 chars of body
  hikedOn: string;       // ISO-8601 date
  createdAt: string;
}

export interface ReviewDetailDto extends ReviewSummaryDto {
  body: string;
  helpfulVotes: number;
  hasUserVoted: boolean;
}

export interface CreateReviewRequestDto {
  trailId: string;
  rating: number;
  body: string;
  hikedOn: string;
}

export interface UpdateReviewRequestDto {
  rating?: number;
  body?: string;
  hikedOn?: string;
}
