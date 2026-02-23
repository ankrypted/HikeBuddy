import { RegionSummaryDto } from './region.dto';
import { MediaSummaryDto }  from './media.dto';
import { PageRequestDto }   from './pagination.dto';

export type DifficultyLevel = 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';

export interface TrailSummaryDto {
  id: string;
  name: string;
  slug: string;
  region: RegionSummaryDto;
  difficulty: DifficultyLevel;
  distanceKm: number;
  durationMinutes: number;
  elevationGainM: number;
  thumbnailUrl: string;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
}

export interface TrailDetailDto extends TrailSummaryDto {
  description: string;
  startLatitude: number;
  startLongitude: number;
  routeGeoJsonUrl: string;  // URL to GeoJSON file in S3
  media: MediaSummaryDto[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TrailFilterDto extends Partial<PageRequestDto> {
  regionId?: string;
  difficulty?: DifficultyLevel;
  minDistanceKm?: number;
  maxDistanceKm?: number;
  minRating?: number;
  searchTerm?: string;
}

export interface ReviewDto {
  id:                   string;
  authorName:           string;
  authorAvatarInitials: string;
  rating:               number;   // 1–5
  comment:              string;
  visitedOn:            string;   // e.g. "August 2024"
}
