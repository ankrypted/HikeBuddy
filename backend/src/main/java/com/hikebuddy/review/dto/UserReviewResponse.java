package com.hikebuddy.review.dto;

public record UserReviewResponse(
        String id,
        String authorName,
        String authorAvatarInitials,
        int    rating,
        String comment,
        String visitedOn,
        String trailName,
        String trailSlug
) {}
