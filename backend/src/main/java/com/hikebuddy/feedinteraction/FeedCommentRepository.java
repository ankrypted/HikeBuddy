package com.hikebuddy.feedinteraction;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedCommentRepository extends JpaRepository<FeedComment, UUID> {

    List<FeedComment> findByOwnerUsernameAndEventIdOrderByCreatedAtAsc(String ownerUsername, String eventId);

    List<FeedComment> findByOwnerUsernameAndEventIdIn(String ownerUsername, List<String> eventIds);
}
