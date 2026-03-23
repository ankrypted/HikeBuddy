package com.hikebuddy.hikepost;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hike_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class HikePost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "trail_name", nullable = false, length = 128)
    private String trailName;

    @Column(name = "trail_slug", nullable = false, length = 128)
    private String trailSlug;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String experience;

    @Column(nullable = false, length = 16)
    private String condition;

    @Column(nullable = false, length = 8)
    private String recommendation;

    @Column(columnDefinition = "TEXT")
    private String tip;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
