import { DifficultyLevel } from './trail.dto';

export interface PublicTrailRef {
  id:            string;
  name:          string;
  slug:          string;
  difficulty:    DifficultyLevel;
  regionName:    string;
  averageRating: number;
}

export interface PublicReviewDto {
  id:        string;
  trailName: string;
  trailSlug: string;
  rating:    number;
  comment:   string;
  visitedOn: string;
}

export interface PublicUserDto {
  id:                   string;
  username:             string;
  avatarUrl:            string | null;
  bio:                  string | null;
  joinedAt:             string;   // ISO-8601
  completedTrailsCount: number;
  reviewsCount:         number;
  savedTrailsCount:     number;
  completedTrails:      PublicTrailRef[];
  recentReviews:        PublicReviewDto[];
}
