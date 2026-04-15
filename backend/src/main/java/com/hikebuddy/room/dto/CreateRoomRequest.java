package com.hikebuddy.room.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CreateRoomRequest(
        @NotBlank String trailId,
        @NotBlank String trailName,
        @NotNull  LocalDate plannedDate,
        @NotBlank @Size(max = 200) String title,
        @NotNull @Min(1) @Max(30) Integer durationDays
) {}
