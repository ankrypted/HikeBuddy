import { TrailSummaryDto } from './trail.dto';

export interface FavoriteSummaryDto {
  id: string;
  trail: TrailSummaryDto;
  savedAt: string;
  note: string | null;
}

export interface AddFavoriteRequestDto {
  trailId: string;
  note?: string;
}

export interface FavoritesPageDto {
  favorites: FavoriteSummaryDto[];
  totalCount: number;
}
