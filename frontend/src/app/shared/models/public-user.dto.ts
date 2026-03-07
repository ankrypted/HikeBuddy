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

export type ActivityEventType = 'completed' | 'reviewed' | 'saved';


export interface ActivityEvent {
  id:         string;
  type:       ActivityEventType;
  timestamp:  string;           // ISO-8601
  trailId?:   string;           // set by backend; resolved to metadata by component
  trailName?: string;
  trailSlug?: string;
  difficulty?: DifficultyLevel;
  regionName?: string;
  rating?:    number;           // only for 'reviewed'
  comment?:   string;           // only for 'reviewed'
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
  completedTrailIds:    string[];          // IDs from backend — resolved to refs in component
  completedTrails:      PublicTrailRef[];  // populated by mock profiles only
  recentReviews:        PublicReviewDto[];
  recentActivity:       ActivityEvent[];
}
