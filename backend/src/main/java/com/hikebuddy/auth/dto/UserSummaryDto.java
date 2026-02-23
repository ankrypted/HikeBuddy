package com.hikebuddy.auth.dto;

import com.hikebuddy.user.User;

public record UserSummaryDto(
        String id,
        String username,
        String avatarUrl
) {
    public static UserSummaryDto from(User user) {
        return new UserSummaryDto(
                user.getId().toString(),
                user.getUsername(),
                user.getAvatarUrl()
        );
    }
}
