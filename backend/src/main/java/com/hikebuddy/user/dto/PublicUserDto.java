package com.hikebuddy.user.dto;

import com.hikebuddy.user.User;

import java.time.Instant;
import java.util.List;

public record PublicUserDto(
        String id,
        String username,
        String avatarUrl,
        String bio,
        Instant joinedAt,
        long completedTrailsCount,
        long reviewsCount,
        long savedTrailsCount,
        List<Object> completedTrails,
        List<Object> recentReviews,
        List<Object> recentActivity
) {
    public static PublicUserDto from(User user, long completedCount, long reviewCount, long savedCount) {
        return new PublicUserDto(
                user.getId().toString(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getCreatedAt(),
                completedCount,
                reviewCount,
                savedCount,
                List.of(),
                List.of(),
                List.of()
        );
    }
}
