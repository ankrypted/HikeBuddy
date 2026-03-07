package com.hikebuddy.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UserSubscriptionId> {

    @Query("SELECT s.id.followeeId FROM UserSubscription s WHERE s.id.followerId = :followerId")
    List<UUID> findFolloweeIdsByFollowerId(UUID followerId);

    long countByIdFolloweeId(UUID followeeId);
}
