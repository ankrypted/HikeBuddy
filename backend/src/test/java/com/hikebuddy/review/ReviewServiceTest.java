package com.hikebuddy.review;

import com.hikebuddy.review.dto.CreateReviewRequest;
import com.hikebuddy.review.dto.ReviewResponse;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)         // (1) activates Mockito
class ReviewServiceTest {

    // (2) @Mock creates a fake version of each dependency
    @Mock TrailReviewRepository    repo;
    @Mock UserRepository           userRepository;
    @Mock ContentModerationService moderationService;

    // (3) @InjectMocks creates ReviewService and injects the mocks above into it
    @InjectMocks ReviewService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .username("Ana Hiker")
                .email("ana@test.com")
                .provider(User.AuthProvider.LOCAL)
                .build();
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    @Test
    void submitReview_cleanContent_savesAndReturnsResponse() {
        // ARRANGE — teach each mock what to return when called
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(testUser));
        when(repo.existsByUserIdAndTrailId(testUser.getId(), "hampta-pass")).thenReturn(false);
        when(moderationService.moderate(any(), anyInt(), any())).thenReturn(ModerationResult.pass());
        when(repo.saveAndFlush(any())).thenReturn(savedReview(testUser.getId()));

        // ACT
        ReviewResponse response = service.submitReview(
                "ana@test.com",
                "hampta-pass",
                new CreateReviewRequest(4, "Stunning views, tough climb!", "Hampta Pass", "hampta-pass")
        );

        // ASSERT
        assertThat(response.rating()).isEqualTo((short) 4);
        assertThat(response.comment()).isEqualTo("Stunning views, tough climb!");
        assertThat(response.authorName()).isEqualTo("Ana Hiker");

        // Verify the review was actually saved once
        verify(repo, times(1)).saveAndFlush(any());
    }

    // ── Moderation blocks the review ──────────────────────────────────────────

    @Test
    void submitReview_spamContent_throws422() {
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(testUser));
        when(repo.existsByUserIdAndTrailId(any(), any())).thenReturn(false);
        when(moderationService.moderate(any(), anyInt(), any()))
                .thenReturn(new ModerationResult(false, "spam", "Promotional content detected"));

        assertThatThrownBy(() -> service.submitReview(
                "ana@test.com",
                "hampta-pass",
                new CreateReviewRequest(1, "Buy cheap gear at traildeals.com!!!", "Hampta Pass", null)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> {
                    ResponseStatusException rse = (ResponseStatusException) ex;
                    assertThat(rse.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY);
                    assertThat(rse.getReason()).contains("Promotional content detected");
                });

        // Confirm nothing was saved
        verify(repo, never()).saveAndFlush(any());
    }

    @Test
    void submitReview_hateSpeech_throws422() {
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(testUser));
        when(repo.existsByUserIdAndTrailId(any(), any())).thenReturn(false);
        when(moderationService.moderate(any(), anyInt(), any()))
                .thenReturn(new ModerationResult(false, "hate_speech", "Discriminatory language"));

        assertThatThrownBy(() -> service.submitReview(
                "ana@test.com",
                "hampta-pass",
                new CreateReviewRequest(1, "[hateful content]", "Hampta Pass", null)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNPROCESSABLE_ENTITY));
    }

    // ── Moderation API failure → fail-open ────────────────────────────────────

    @Test
    void submitReview_moderationApiDown_stillSaves() {
        // The moderation service itself fails open — it returns pass() on any error.
        // This test ensures ReviewService handles that correctly (review goes through).
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(testUser));
        when(repo.existsByUserIdAndTrailId(any(), any())).thenReturn(false);
        when(moderationService.moderate(any(), anyInt(), any())).thenReturn(ModerationResult.pass());
        when(repo.saveAndFlush(any())).thenReturn(savedReview(testUser.getId()));

        assertThatNoException().isThrownBy(() -> service.submitReview(
                "ana@test.com",
                "hampta-pass",
                new CreateReviewRequest(5, "Incredible!", "Hampta Pass", "hampta-pass")
        ));

        verify(repo, times(1)).saveAndFlush(any());
    }

    // ── Duplicate review ──────────────────────────────────────────────────────

    @Test
    void submitReview_duplicate_throws409() {
        when(userRepository.findByEmail("ana@test.com")).thenReturn(Optional.of(testUser));
        when(repo.existsByUserIdAndTrailId(testUser.getId(), "hampta-pass")).thenReturn(true);

        assertThatThrownBy(() -> service.submitReview(
                "ana@test.com",
                "hampta-pass",
                new CreateReviewRequest(3, "Second attempt", "Hampta Pass", null)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        // Moderation should not even be called for duplicates
        verify(moderationService, never()).moderate(any(), anyInt(), any());
        verify(repo, never()).saveAndFlush(any());
    }

    // ── User not found ────────────────────────────────────────────────────────

    @Test
    void submitReview_unknownUser_throws500() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submitReview(
                "ghost@test.com",
                "hampta-pass",
                new CreateReviewRequest(3, "Who am I?", "Hampta Pass", null)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private TrailReview savedReview(UUID userId) {
        return TrailReview.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .trailId("hampta-pass")
                .trailName("Hampta Pass")
                .trailSlug("hampta-pass")
                .rating((short) 4)
                .comment("Stunning views, tough climb!")
                .createdAt(Instant.now())   // Hibernate sets this in prod; we set it manually here
                .build();
    }
}
