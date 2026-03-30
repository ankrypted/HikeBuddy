package com.hikebuddy.room;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "room_members")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RoomMember {

    @EmbeddedId
    private RoomMemberId id;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;
}
