package com.hikebuddy.completedtrail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserCompletedTrailRepository extends JpaRepository<UserCompletedTrail, UserCompletedTrailId> {

    @Query("SELECT c.id.trailId FROM UserCompletedTrail c WHERE c.id.userId = :userId ORDER BY c.completedAt DESC")
    List<String> findTrailIdsByUserId(@Param("userId") UUID userId);
}
