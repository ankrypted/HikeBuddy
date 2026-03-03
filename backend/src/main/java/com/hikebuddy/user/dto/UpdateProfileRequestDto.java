package com.hikebuddy.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequestDto(
        @Size(max = 500) String bio,
        String avatarUrl
) {}
