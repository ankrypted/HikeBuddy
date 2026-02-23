export interface RegionSummaryDto {
  id: string;
  name: string;
  country: string;
  countryCode: string;  // ISO 3166-1 alpha-2
  thumbnailUrl: string;
}

export interface RegionDetailDto extends RegionSummaryDto {
  description: string;
  trailCount: number;
  latitude: number;
  longitude: number;
  createdAt: string;    // ISO-8601
}
