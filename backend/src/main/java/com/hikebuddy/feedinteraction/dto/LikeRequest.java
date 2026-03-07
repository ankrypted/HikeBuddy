package com.hikebuddy.feedinteraction.dto;

import jakarta.validation.constraints.NotBlank;

public record LikeRequest(
        @NotBlank String trailName,
        @NotBlank String eventType
) {}
