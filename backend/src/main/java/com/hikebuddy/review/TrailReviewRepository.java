package com.hikebuddy.review;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TrailReviewRepository extends JpaRepository<TrailReview, UUID> {

    List<TrailReview> findByTrailIdOrderByCreatedAtDesc(String trailId);

    boolean existsByUserIdAndTrailId(UUID userId, String trailId);
}
