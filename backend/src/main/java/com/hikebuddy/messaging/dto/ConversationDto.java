package com.hikebuddy.messaging.dto;

public record ConversationDto(
        String id,
        String otherUsername,
        String otherAvatarUrl,
        String lastMessage,
        String lastMessageTime,
        int    unreadCount
) {}
