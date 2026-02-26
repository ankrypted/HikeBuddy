package com.hikebuddy.review;

import com.hikebuddy.review.dto.CreateReviewRequest;
import com.hikebuddy.review.dto.ReviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/trails/{trailId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService service;

    /** GET /api/v1/trails/{trailId}/reviews — public */
    @GetMapping
    public List<ReviewResponse> getReviews(@PathVariable String trailId) {
        return service.getReviewsForTrail(trailId);
    }

    /** POST /api/v1/trails/{trailId}/reviews — authenticated */
    @PostMapping
    public ResponseEntity<ReviewResponse> submitReview(
            @PathVariable String trailId,
            Authentication auth,
            @Valid @RequestBody CreateReviewRequest request) {

        ReviewResponse response = service.submitReview(auth.getName(), trailId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
