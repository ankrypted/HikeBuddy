package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomRepository extends JpaRepository<Room, UUID> {

    @Query(value = """
            SELECT r.* FROM rooms r
            INNER JOIN room_members m ON m.room_id = r.id
            WHERE m.user_id = :userId
            ORDER BY r.planned_date ASC
            """, nativeQuery = true)
    List<Room> findByMember(@Param("userId") UUID userId);

    List<Room> findByTrailIdAndStatusOrderByPlannedDateAsc(String trailId, String status);
}
