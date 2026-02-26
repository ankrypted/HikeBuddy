package com.hikebuddy.savedtrail;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_saved_trails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSavedTrail {

    @EmbeddedId
    private UserSavedTrailId id;

    @CreationTimestamp
    @Column(name = "saved_at", nullable = false, updatable = false)
    private Instant savedAt;
}
