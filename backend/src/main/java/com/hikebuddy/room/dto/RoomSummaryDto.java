package com.hikebuddy.room.dto;

public record RoomSummaryDto(
        String id,
        String trailId,
        String trailName,
        String plannedDate,
        String title,
        String status,
        String creatorUsername,
        int    memberCount,
        String createdAt,
        int    durationDays,
        String deletesOn
) {}
