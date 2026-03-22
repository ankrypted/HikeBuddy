export type TrailCondition = 'GREAT' | 'MUDDY' | 'SNOWY' | 'CROWDED' | 'AVOID';

export interface HikePostDto {
  id:        string;
  author:    { username: string; avatarUrl: string | null };
  trailName: string;
  trailSlug: string;
  condition: TrailCondition;
  caption:   string;
  timestamp: string;   // ISO-8601
}
