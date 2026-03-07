package com.hikebuddy.feedinteraction;

import com.hikebuddy.feedinteraction.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/feed")
@RequiredArgsConstructor
public class FeedInteractionController {

    private final FeedInteractionService service;

    /** POST /api/v1/feed/events/{owner}/{eventId}/like — toggle like */
    @PostMapping("/events/{ownerUsername}/{eventId}/like")
    public InteractionSummaryDto toggleLike(
            Authentication auth,
            @PathVariable String ownerUsername,
            @PathVariable String eventId,
            @Valid @RequestBody LikeRequest request) {
        return service.toggleLike(auth.getName(), ownerUsername, eventId, request);
    }

    /** POST /api/v1/feed/events/{owner}/{eventId}/comments */
    @PostMapping("/events/{ownerUsername}/{eventId}/comments")
    public ResponseEntity<FeedCommentDto> postComment(
            Authentication auth,
            @PathVariable String ownerUsername,
            @PathVariable String eventId,
            @Valid @RequestBody CommentRequest request) {
        FeedCommentDto dto = service.postComment(auth.getName(), ownerUsername, eventId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    /** POST /api/v1/feed/interactions/summaries — batch fetch */
    @PostMapping("/interactions/summaries")
    public Map<String, InteractionSummaryDto> batchSummaries(
            Authentication auth,
            @RequestBody List<FeedEventRef> refs) {
        return service.batchSummaries(auth.getName(), refs);
    }
}
