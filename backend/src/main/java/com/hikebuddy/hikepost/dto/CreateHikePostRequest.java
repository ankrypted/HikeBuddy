package com.hikebuddy.hikepost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateHikePostRequest(

        @NotBlank
        @Size(max = 128)
        String trailName,

        @NotBlank
        @Size(max = 128)
        String trailSlug,

        @NotBlank
        @Size(max = 1000)
        String experience,

        @NotBlank
        @Pattern(regexp = "GREAT|MUDDY|SNOWY|CROWDED|AVOID",
                 message = "condition must be one of: GREAT, MUDDY, SNOWY, CROWDED, AVOID")
        String condition,

        @NotBlank
        @Pattern(regexp = "YES|MAYBE|NO",
                 message = "recommendation must be one of: YES, MAYBE, NO")
        String recommendation,

        @Size(max = 500)
        String tip
) {}
