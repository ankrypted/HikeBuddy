package com.hikebuddy.hikepost;

import com.hikebuddy.hikepost.dto.CreateHikePostRequest;
import com.hikebuddy.hikepost.dto.HikePostResponse;
import com.hikebuddy.review.ContentModerationService;
import com.hikebuddy.review.ModerationResult;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HikePostService {

    private final HikePostRepository     repo;
    private final UserRepository         userRepository;
    private final ContentModerationService moderationService;

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public HikePostResponse create(String email, CreateHikePostRequest req) {
        User user = requireUser(email);

        // Moderate experience + tip together
        String textToCheck = req.experience()
                + (req.tip() != null ? " " + req.tip() : "");
        ModerationResult mod = moderationService.moderate(textToCheck, 0, req.trailName());
        if (!mod.approved()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, mod.reason());
        }

        HikePost post = HikePost.builder()
                .userId(user.getId())
                .trailName(req.trailName())
                .trailSlug(req.trailSlug())
                .experience(req.experience())
                .condition(req.condition())
                .recommendation(req.recommendation())
                .tip(req.tip() != null && !req.tip().isBlank() ? req.tip() : null)
                .build();

        post = repo.saveAndFlush(post);
        return toResponse(post, user);
    }

    // ── Feed (posts from followed users) ──────────────────────────────────────

    @Transactional(readOnly = true)
    public List<HikePostResponse> getFeed(String email) {
        User user = requireUser(email);
        List<HikePost> posts = repo.findFeedPosts(user.getId());
        return toResponses(posts);
    }

    // ── User posts (public) ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<HikePostResponse> getUserPosts(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<HikePost> posts = repo.findByUserIdOrderByCreatedAtDesc(user.getId());
        return posts.stream().map(p -> toResponse(p, user)).toList();
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public void delete(String email, UUID postId) {
        User user = requireUser(email);
        HikePost post = repo.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        if (!post.getUserId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only delete your own posts");
        }
        repo.delete(post);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<HikePostResponse> toResponses(List<HikePost> posts) {
        if (posts.isEmpty()) return List.of();
        List<UUID> ids = posts.stream().map(HikePost::getUserId).distinct().toList();
        Map<UUID, User> users = userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, u -> u));
        return posts.stream()
                .map(p -> toResponse(p, users.get(p.getUserId())))
                .toList();
    }

    private HikePostResponse toResponse(HikePost p, User user) {
        return new HikePostResponse(
                p.getId().toString(),
                new HikePostResponse.Author(
                        user != null ? user.getUsername() : "unknown",
                        user != null ? user.getAvatarUrl() : null),
                p.getTrailName(),
                p.getTrailSlug(),
                p.getExperience(),
                p.getCondition(),
                p.getRecommendation(),
                p.getTip(),
                p.getCreatedAt().toString()
        );
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Authenticated user not found: " + email));
    }
}
