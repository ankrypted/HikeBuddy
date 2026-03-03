package com.hikebuddy.user.dto;

import com.hikebuddy.user.User;

import java.time.Instant;

public record UserProfileDto(
        String id,
        String username,
        String email,
        String avatarUrl,
        String bio,
        String provider,
        String joinedAt
) {
    public static UserProfileDto from(User user) {
        return new UserProfileDto(
                user.getId().toString(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getProvider().name(),
                user.getCreatedAt().toString()
        );
    }
}
