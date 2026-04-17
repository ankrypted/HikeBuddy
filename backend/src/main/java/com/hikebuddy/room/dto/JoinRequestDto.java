package com.hikebuddy.room.dto;

public record JoinRequestDto(
        String id,
        String requesterUsername,
        String requesterAvatarUrl,
        String createdAt
) {}
