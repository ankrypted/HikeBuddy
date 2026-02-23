export interface PageRequestDto {
  page: number;    // 0-indexed to match Spring Pageable
  size: number;
  sort?: string;   // e.g. 'name,asc'
}

export interface PageResponseDto<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;  // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}
