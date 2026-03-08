package com.hikebuddy.messaging;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "conversation")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Conversation {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "participant_a", nullable = false, length = 50)
    private String participantA;

    @Column(name = "participant_b", nullable = false, length = 50)
    private String participantB;

    @Column(name = "last_message_at", nullable = false)
    private Instant lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
