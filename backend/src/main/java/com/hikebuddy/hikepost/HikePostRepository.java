package com.hikebuddy.hikepost;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HikePostRepository extends JpaRepository<HikePost, UUID> {

    /** Posts from users the given user follows, newest first, capped at 100. */
    @Query(value = """
            SELECT p.* FROM hike_posts p
            INNER JOIN user_subscriptions s ON p.user_id = s.followee_id
            WHERE s.follower_id = :followerId
            ORDER BY p.created_at DESC
            LIMIT 100
            """, nativeQuery = true)
    List<HikePost> findFeedPosts(@Param("followerId") UUID followerId);

    List<HikePost> findByUserIdOrderByCreatedAtDesc(UUID userId);

    void deleteByUserId(UUID userId);
}
