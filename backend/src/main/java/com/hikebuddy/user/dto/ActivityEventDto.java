package com.hikebuddy.user.dto;

import java.time.Instant;

public record ActivityEventDto(
        String id,
        String type,        // "completed" | "reviewed" | "saved"
        Instant timestamp,
        String trailId,
        Integer rating,     // non-null only for "reviewed"
        String comment      // non-null only for "reviewed"
) {}
