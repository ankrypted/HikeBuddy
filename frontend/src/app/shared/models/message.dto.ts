export interface ConversationDto {
  id:              string;
  otherUsername:   string;
  otherAvatarUrl:  string | null;
  lastMessage:     string;
  lastMessageTime: string;
  unreadCount:     number;
}

export interface MessageDto {
  id:             string;
  senderUsername: string;
  body:           string;
  sentAt:         string;
  mine:           boolean;
}
