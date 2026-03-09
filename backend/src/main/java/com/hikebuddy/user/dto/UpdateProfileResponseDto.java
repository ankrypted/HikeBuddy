package com.hikebuddy.user.dto;

/**
 * Returned by PATCH /api/v1/users/me.
 * {@code newToken} is non-null only when the username changed and a fresh JWT was issued.
 */
public record UpdateProfileResponseDto(
        UserProfileDto profile,
        String newToken
) {}
