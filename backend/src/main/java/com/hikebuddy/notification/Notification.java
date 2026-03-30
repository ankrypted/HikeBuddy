package com.hikebuddy.notification;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** The user who receives this notification. */
    @Column(name = "recipient_id", nullable = false)
    private UUID recipientId;

    /** Username of the user who triggered the notification. */
    @Column(name = "actor_username", nullable = false, length = 50)
    private String actorUsername;

    /** Avatar URL of the actor (denormalised for display). */
    @Column(name = "actor_avatar_url")
    private String actorAvatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationType type;

    @Column(name = "owner_username", nullable = false, length = 50)
    private String ownerUsername;

    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    /** Pre-built human-readable message (e.g. "temp liked your review of Roopkund Trek"). */
    @Column(nullable = false, length = 300)
    private String message;

    @Builder.Default
    @Column(nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum NotificationType { LIKE, COMMENT, SUBSCRIPTION, ROOM_INVITE }
}
