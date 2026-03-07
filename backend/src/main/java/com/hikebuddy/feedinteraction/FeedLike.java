package com.hikebuddy.feedinteraction;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "feed_likes",
       uniqueConstraints = @UniqueConstraint(columnNames = {"owner_username", "event_id", "liker_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class FeedLike {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_username", nullable = false, length = 50)
    private String ownerUsername;

    @Column(name = "event_id", nullable = false, length = 100)
    private String eventId;

    @Column(name = "liker_id", nullable = false)
    private UUID likerId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
