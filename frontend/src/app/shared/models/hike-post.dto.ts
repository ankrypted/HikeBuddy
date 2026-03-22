export interface HikePostDto {
  id:         string;
  author:     { username: string; avatarUrl: string | null };
  content:    string;
  trailName?: string;
  trailSlug?: string;
  timestamp:  string;   // ISO-8601
}
