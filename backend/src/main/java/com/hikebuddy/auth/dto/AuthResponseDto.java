package com.hikebuddy.auth.dto;

import com.hikebuddy.user.UserRole;

import java.util.List;

public record AuthResponseDto(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserSummaryDto user,
        List<String> roles
) {
    public static AuthResponseDto of(String token, long expiresInMs, UserSummaryDto user, List<UserRole> roles) {
        return new AuthResponseDto(
                token,
                "Bearer",
                expiresInMs / 1000,
                user,
                roles.stream().map(UserRole::name).toList()
        );
    }
}
