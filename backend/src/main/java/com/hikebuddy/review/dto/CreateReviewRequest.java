package com.hikebuddy.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreateReviewRequest(
        @Min(1) @Max(5) int rating,
        @NotBlank String comment
) {}
