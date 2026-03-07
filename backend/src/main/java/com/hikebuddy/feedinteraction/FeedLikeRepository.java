package com.hikebuddy.feedinteraction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedLikeRepository extends JpaRepository<FeedLike, UUID> {

    long countByOwnerUsernameAndEventId(String ownerUsername, String eventId);

    Optional<FeedLike> findByOwnerUsernameAndEventIdAndLikerId(String ownerUsername, String eventId, UUID likerId);

    boolean existsByOwnerUsernameAndEventIdAndLikerId(String ownerUsername, String eventId, UUID likerId);

    List<FeedLike> findByOwnerUsernameAndEventIdIn(String ownerUsername, List<String> eventIds);
}
