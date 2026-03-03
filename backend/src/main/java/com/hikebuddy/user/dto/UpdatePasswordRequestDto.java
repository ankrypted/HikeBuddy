package com.hikebuddy.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdatePasswordRequestDto(
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 8) String newPassword
) {}
