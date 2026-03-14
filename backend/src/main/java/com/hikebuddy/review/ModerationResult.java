package com.hikebuddy.review;

public record ModerationResult(boolean approved, String category, String reason) {

    public static ModerationResult pass() {
        return new ModerationResult(true, "clean", "Approved");
    }
}
