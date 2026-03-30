package com.hikebuddy.room;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "room_updates")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RoomUpdate {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "room_id", nullable = false)
    private UUID roomId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_username", nullable = false, length = 50)
    private String authorUsername;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
