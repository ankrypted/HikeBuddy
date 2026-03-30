package com.hikebuddy.room.dto;

public record RoomMessageDto(
        String  id,
        String  senderUsername,
        String  senderAvatarUrl,
        String  content,
        String  sentAt,
        boolean mine
) {}
