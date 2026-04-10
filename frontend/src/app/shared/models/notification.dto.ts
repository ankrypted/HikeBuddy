export interface NotificationDto {
  id:            string;
  actorUsername: string;
  actorAvatarUrl: string | null;
  type:          'LIKE' | 'COMMENT' | 'SUBSCRIPTION' | 'ROOM_INVITE' | 'JOIN_REQUEST';
  ownerUsername: string;
  eventId:       string;
  message:       string;
  read:          boolean;
  createdAt:     string;
}
