package com.hikebuddy.feedinteraction;

import com.hikebuddy.feedinteraction.dto.*;
import com.hikebuddy.notification.NotificationService;
import com.hikebuddy.notification.Notification.NotificationType;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FeedInteractionService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneId.of("UTC"));

    private final FeedLikeRepository    likeRepo;
    private final FeedCommentRepository commentRepo;
    private final UserRepository        userRepository;
    private final NotificationService   notificationService;

    // ── Like toggle ──────────────────────────────────────────────────────────

    @Transactional
    public InteractionSummaryDto toggleLike(String actorEmail,
                                            String ownerUsername,
                                            String eventId,
                                            LikeRequest req) {
        User actor = findByEmail(actorEmail);
        Optional<FeedLike> existing =
                likeRepo.findByOwnerUsernameAndEventIdAndLikerId(ownerUsername, eventId, actor.getId());

        if (existing.isPresent()) {
            likeRepo.delete(existing.get());
        } else {
            likeRepo.save(FeedLike.builder()
                    .ownerUsername(ownerUsername)
                    .eventId(eventId)
                    .likerId(actor.getId())
                    .build());

            // Notify owner (skip self-like)
            if (!actor.getUsername().equals(ownerUsername)) {
                notificationService.createNotification(
                        ownerUsername, actor, NotificationType.LIKE,
                        ownerUsername, eventId, req.trailName(), req.eventType());
            }
        }

        long likeCount = likeRepo.countByOwnerUsernameAndEventId(ownerUsername, eventId);
        boolean likedByMe = likeRepo.existsByOwnerUsernameAndEventIdAndLikerId(
                ownerUsername, eventId, actor.getId());
        List<FeedCommentDto> comments = loadComments(ownerUsername, eventId);
        return new InteractionSummaryDto(likeCount, likedByMe, comments);
    }

    // ── Post comment ─────────────────────────────────────────────────────────

    @Transactional
    public FeedCommentDto postComment(String actorEmail,
                                      String ownerUsername,
                                      String eventId,
                                      CommentRequest req) {
        User actor = findByEmail(actorEmail);

        FeedComment saved = commentRepo.save(FeedComment.builder()
                .ownerUsername(ownerUsername)
                .eventId(eventId)
                .authorId(actor.getId())
                .body(req.body())
                .build());

        // Notify owner (skip self-comment)
        if (!actor.getUsername().equals(ownerUsername)) {
            notificationService.createNotification(
                    ownerUsername, actor, NotificationType.COMMENT,
                    ownerUsername, eventId, req.trailName(), req.eventType());
        }

        return toCommentDto(saved, actor);
    }

    // ── Batch summaries ──────────────────────────────────────────────────────

    public Map<String, InteractionSummaryDto> batchSummaries(String actorEmail,
                                                              List<FeedEventRef> refs) {
        User actor = findByEmail(actorEmail);
        Map<String, InteractionSummaryDto> result = new LinkedHashMap<>();

        for (FeedEventRef ref : refs) {
            long likeCount = likeRepo.countByOwnerUsernameAndEventId(ref.ownerUsername(), ref.eventId());
            boolean likedByMe = likeRepo.existsByOwnerUsernameAndEventIdAndLikerId(
                    ref.ownerUsername(), ref.eventId(), actor.getId());
            List<FeedCommentDto> comments = loadComments(ref.ownerUsername(), ref.eventId());
            result.put(ref.ownerUsername() + ":" + ref.eventId(),
                    new InteractionSummaryDto(likeCount, likedByMe, comments));
        }
        return result;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<FeedCommentDto> loadComments(String ownerUsername, String eventId) {
        return commentRepo.findByOwnerUsernameAndEventIdOrderByCreatedAtAsc(ownerUsername, eventId)
                .stream()
                .map(c -> {
                    User author = userRepository.findById(c.getAuthorId()).orElse(null);
                    return toCommentDto(c, author);
                })
                .toList();
    }

    private FeedCommentDto toCommentDto(FeedComment c, User author) {
        String username  = author != null ? author.getUsername()  : "Unknown";
        String avatarUrl = author != null ? author.getAvatarUrl() : null;
        return new FeedCommentDto(
                c.getId().toString(),
                username,
                avatarUrl,
                c.getBody(),
                FMT.format(c.getCreatedAt()));
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Authenticated user not found: " + email));
    }
}
