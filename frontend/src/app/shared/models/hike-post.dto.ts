export type TrailCondition  = 'GREAT' | 'MUDDY' | 'SNOWY' | 'CROWDED' | 'AVOID';
export type Recommendation  = 'YES' | 'MAYBE' | 'NO';

export interface HikePostDto {
  id:             string;
  author:         { username: string; avatarUrl: string | null };
  trailName:      string;
  trailSlug:      string;
  experience:     string;        // "How was it overall?"
  condition:      TrailCondition;
  recommendation: Recommendation;
  tip?:           string;        // optional tip for fellow hikers
  timestamp:      string;        // ISO-8601
}
