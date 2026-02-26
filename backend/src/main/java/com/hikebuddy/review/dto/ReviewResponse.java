package com.hikebuddy.review.dto;

public record ReviewResponse(
        String id,
        String authorName,
        String authorAvatarInitials,
        int rating,
        String comment,
        String visitedOn
) {}
