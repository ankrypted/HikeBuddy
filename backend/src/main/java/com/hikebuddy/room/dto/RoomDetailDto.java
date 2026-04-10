package com.hikebuddy.room.dto;

import java.util.List;

public record RoomDetailDto(
        String id,
        String trailId,
        String trailName,
        String plannedDate,
        String title,
        String status,
        String creatorUsername,
        List<MemberDto> members,
        int memberCount,
        String createdAt,
        String pendingRequestId
) {
    public record MemberDto(String username, String avatarUrl) {}
}
