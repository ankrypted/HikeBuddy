package com.hikebuddy.review;

import com.hikebuddy.review.dto.CreateReviewRequest;
import com.hikebuddy.review.dto.ReviewResponse;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final DateTimeFormatter VISITED_ON_FMT =
            DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH)
                             .withZone(ZoneId.of("UTC"));

    private final TrailReviewRepository repo;
    private final UserRepository        userRepository;

    public List<ReviewResponse> getReviewsForTrail(String trailId) {
        return repo.findByTrailIdOrderByCreatedAtDesc(trailId)
                   .stream()
                   .map(r -> toResponse(r, resolveUser(r.getUserId())))
                   .toList();
    }

    @Transactional
    public ReviewResponse submitReview(String email, String trailId, CreateReviewRequest req) {
        // Use ResponseStatusException instead of UsernameNotFoundException:
        // UsernameNotFoundException extends AuthenticationException, and if it escapes
        // through Spring MVC to ExceptionTranslationFilter it causes an unexpected 401.
        User user   = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Authenticated user not found: " + email));

        if (repo.existsByUserIdAndTrailId(user.getId(), trailId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You have already reviewed this trail");
        }

        TrailReview review = TrailReview.builder()
                .userId(user.getId())
                .trailId(trailId)
                .rating((short) req.rating())
                .comment(req.comment())
                .build();

        // saveAndFlush forces the INSERT immediately so Hibernate populates the
        // @CreationTimestamp field before toResponse() reads r.getCreatedAt().
        // Plain save() defers the flush to transaction commit, leaving createdAt null.
        review = repo.saveAndFlush(review);
        return toResponse(review, user);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User resolveUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    private ReviewResponse toResponse(TrailReview r, User user) {
        return new ReviewResponse(
                r.getId().toString(),
                user.getUsername(),
                initials(user.getUsername()),
                r.getRating(),
                r.getComment(),
                VISITED_ON_FMT.format(r.getCreatedAt())
        );
    }

    private String initials(String username) {
        String[] parts = username.trim().split("\\s+");
        if (parts.length == 1) {
            return username.substring(0, Math.min(2, username.length())).toUpperCase();
        }
        return (String.valueOf(parts[0].charAt(0)) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
}
