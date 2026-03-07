package com.hikebuddy.feedinteraction.dto;

public record FeedCommentDto(
        String id,
        String author,
        String avatarUrl,
        String text,
        String createdAt
) {}
