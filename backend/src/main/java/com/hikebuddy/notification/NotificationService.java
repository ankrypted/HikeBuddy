package com.hikebuddy.notification;

import com.hikebuddy.notification.dto.NotificationDto;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("MMM d, yyyy").withZone(ZoneId.of("UTC"));

    private final NotificationRepository notificationRepo;
    private final UserRepository         userRepository;

    public void createNotification(String recipientUsername,
                                   User actor,
                                   Notification.NotificationType type,
                                   String ownerUsername,
                                   String eventId,
                                   String trailName,
                                   String eventType) {
        User recipient = userRepository.findByUsername(recipientUsername).orElse(null);
        if (recipient == null) return;

        String message = buildMessage(type, actor.getUsername(), eventType, trailName);

        notificationRepo.save(Notification.builder()
                .recipientId(recipient.getId())
                .actorUsername(actor.getUsername())
                .actorAvatarUrl(actor.getAvatarUrl())
                .type(type)
                .ownerUsername(ownerUsername)
                .eventId(eventId)
                .message(message)
                .build());
    }

    public List<NotificationDto> getNotifications(String email) {
        User user = findByEmail(email);
        return notificationRepo.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    public long getUnreadCount(String email) {
        User user = findByEmail(email);
        return notificationRepo.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markAllRead(String email) {
        User user = findByEmail(email);
        notificationRepo.markAllReadForRecipient(user.getId());
    }

    @Transactional
    public void dismiss(String email, UUID notificationId) {
        Notification n = notificationRepo.findById(notificationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        User user = findByEmail(email);
        if (!n.getRecipientId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        notificationRepo.delete(n);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String buildMessage(Notification.NotificationType type,
                                String actorUsername,
                                String eventType,
                                String trailName) {
        String action = type == Notification.NotificationType.LIKE ? "liked" : "commented on";
        String verb = switch (eventType) {
            case "completed" -> "completion of";
            case "reviewed"  -> "review of";
            case "saved"     -> "save of";
            default          -> "activity on";
        };
        return actorUsername + " " + action + " your " + verb + " " + trailName;
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(
                n.getId().toString(),
                n.getActorUsername(),
                n.getActorAvatarUrl(),
                n.getType().name(),
                n.getOwnerUsername(),
                n.getEventId(),
                n.getMessage(),
                n.isRead(),
                FMT.format(n.getCreatedAt()));
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Authenticated user not found: " + email));
    }
}
