package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomUpdateRepository extends JpaRepository<RoomUpdate, UUID> {

    List<RoomUpdate> findByRoomIdOrderByCreatedAtDesc(UUID roomId);

    @Query(value = """
            SELECT u.* FROM room_updates u
            INNER JOIN rooms r ON r.id = u.room_id
            WHERE r.trail_id = :trailSlug
            ORDER BY u.created_at DESC
            LIMIT 20
            """, nativeQuery = true)
    List<RoomUpdate> findRecentByTrailSlug(@Param("trailSlug") String trailSlug);
}
