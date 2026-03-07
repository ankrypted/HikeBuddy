package com.hikebuddy.subscription;

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
public class UserSubscriptionId implements Serializable {

    @Column(name = "follower_id")
    private UUID followerId;

    @Column(name = "followee_id")
    private UUID followeeId;
}
