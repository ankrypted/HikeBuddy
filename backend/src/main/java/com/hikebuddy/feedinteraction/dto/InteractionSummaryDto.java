package com.hikebuddy.feedinteraction.dto;

import java.util.List;

public record InteractionSummaryDto(
        long likeCount,
        boolean likedByMe,
        List<FeedCommentDto> comments
) {}
