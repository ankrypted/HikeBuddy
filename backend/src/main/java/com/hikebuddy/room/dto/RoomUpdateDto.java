package com.hikebuddy.room.dto;

public record RoomUpdateDto(
        String id,
        String roomId,
        String roomTitle,
        String trailId,
        String authorUsername,
        String content,
        String createdAt
) {}
