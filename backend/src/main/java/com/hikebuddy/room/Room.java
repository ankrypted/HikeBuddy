package com.hikebuddy.room;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "rooms")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Room {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "trail_id", nullable = false, length = 128)
    private String trailId;

    @Column(name = "trail_name", nullable = false, length = 128)
    private String trailName;

    @Column(name = "planned_date", nullable = false)
    private LocalDate plannedDate;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "OPEN";

    @Column(name = "duration_days", nullable = false)
    @Builder.Default
    private int durationDays = 1;

    @Column(name = "feed_post_id")
    private UUID feedPostId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
