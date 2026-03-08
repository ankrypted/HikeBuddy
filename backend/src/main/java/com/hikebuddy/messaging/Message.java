package com.hikebuddy.messaging;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "message")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Message {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Column(name = "sender_username", nullable = false, length = 50)
    private String senderUsername;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "read_at")
    private Instant readAt;
}
