package com.hikebuddy.notification.dto;

public record NotificationDto(
        String id,
        String actorUsername,
        String actorAvatarUrl,
        String type,           // "LIKE" | "COMMENT"
        String ownerUsername,
        String eventId,
        String message,
        boolean read,
        String createdAt
) {}
