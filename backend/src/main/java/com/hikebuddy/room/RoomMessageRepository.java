package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface RoomMessageRepository extends JpaRepository<RoomMessage, UUID> {

    @Query(value = """
            SELECT * FROM room_messages
            WHERE room_id = :roomId
            ORDER BY sent_at DESC
            LIMIT 50
            """, nativeQuery = true)
    List<RoomMessage> findRecent(@Param("roomId") UUID roomId);

    List<RoomMessage> findByRoomIdAndSentAtAfterOrderBySentAtAsc(UUID roomId, Instant since);

    void deleteByRoomId(UUID roomId);
}
