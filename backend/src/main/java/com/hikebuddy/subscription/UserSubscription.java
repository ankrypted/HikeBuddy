package com.hikebuddy.subscription;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "user_subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSubscription {

    @EmbeddedId
    private UserSubscriptionId id;

    @CreationTimestamp
    @Column(name = "subscribed_at", nullable = false, updatable = false)
    private Instant subscribedAt;
}
