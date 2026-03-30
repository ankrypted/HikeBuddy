export interface RoomSummaryDto {
  id:              string;
  trailId:         string;
  trailName:       string;
  plannedDate:     string;
  title:           string;
  status:          'OPEN' | 'CLOSED';
  creatorUsername: string;
  memberCount:     number;
  createdAt:       string;
}

export interface RoomDetailDto extends RoomSummaryDto {
  members: { username: string; avatarUrl: string | null }[];
}

export interface RoomMessageDto {
  id:              string;
  senderUsername:  string;
  senderAvatarUrl: string | null;
  content:         string;
  sentAt:          string;
  mine:            boolean;
}

export interface RoomUpdateDto {
  id:             string;
  roomId:         string;
  roomTitle:      string;
  trailId:        string;
  authorUsername: string;
  content:        string;
  createdAt:      string;
}

export interface CreateRoomRequest {
  trailId:     string;
  trailName:   string;
  plannedDate: string;
  title:       string;
}
