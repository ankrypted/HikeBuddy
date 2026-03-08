package com.hikebuddy.messaging.dto;

public record MessageDto(
        String  id,
        String  senderUsername,
        String  body,
        String  sentAt,
        boolean mine
) {}
