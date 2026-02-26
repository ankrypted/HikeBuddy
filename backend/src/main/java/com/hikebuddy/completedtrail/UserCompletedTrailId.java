package com.hikebuddy.completedtrail;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class UserCompletedTrailId implements Serializable {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "trail_id")
    private String trailId;
}
