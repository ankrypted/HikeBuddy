package com.hikebuddy.savedtrail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserSavedTrailRepository extends JpaRepository<UserSavedTrail, UserSavedTrailId> {

    @Query("SELECT s.id.trailId FROM UserSavedTrail s WHERE s.id.userId = :userId ORDER BY s.savedAt DESC")
    List<String> findTrailIdsByUserId(@Param("userId") UUID userId);
}
