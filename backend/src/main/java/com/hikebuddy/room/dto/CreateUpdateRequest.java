package com.hikebuddy.room.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateUpdateRequest(
        @NotBlank @Size(max = 2000) String content
) {}
