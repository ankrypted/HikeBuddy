package com.hikebuddy.room.dto;

public record RoomItineraryDto(
        String id,
        String roomId,
        String uploaderUsername,
        String originalFilename,
        long   fileSize,
        String contentType,
        String uploadedAt,
        String fileUrl
) {}
