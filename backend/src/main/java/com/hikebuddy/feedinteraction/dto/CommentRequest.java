package com.hikebuddy.feedinteraction.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank @Size(max = 500) String body,
        @NotBlank String trailName,
        @NotBlank String eventType
) {}
