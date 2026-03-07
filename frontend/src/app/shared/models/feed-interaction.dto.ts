export interface FeedCommentDto {
  id:         string;
  author:     string;
  avatarUrl:  string | null;
  text:       string;
  createdAt:  string;
}

export interface InteractionSummaryDto {
  likeCount:  number;
  likedByMe:  boolean;
  comments:   FeedCommentDto[];
}

export interface FeedEventRef {
  ownerUsername: string;
  eventId:       string;
}
