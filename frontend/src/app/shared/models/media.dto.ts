export type MediaType = 'IMAGE' | 'VIDEO' | 'GPX';

export interface MediaSummaryDto {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
}

export interface MediaDetailDto extends MediaSummaryDto {
  uploadedBy: string;  // userId
  trailId: string;
  fileSize: number;    // bytes
  createdAt: string;
}

export interface UploadMediaRequestDto {
  trailId: string;
  type: MediaType;
  caption?: string;
  // actual file bytes sent as FormData — service constructs FormData
}
