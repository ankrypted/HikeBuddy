package com.hikebuddy.hikepost.dto;

public record HikePostResponse(
        String id,
        Author author,
        String trailName,
        String trailSlug,
        String experience,
        String condition,
        String recommendation,
        String tip,
        String postType,
        String roomId,
        String timestamp
) {
    public record Author(String username, String avatarUrl) {}
}
