package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomItineraryRepository extends JpaRepository<RoomItinerary, UUID> {

    List<RoomItinerary> findByRoomIdOrderByUploadedAtDesc(UUID roomId);

    @Modifying
    @Query("DELETE FROM RoomItinerary i WHERE i.roomId = :roomId")
    void deleteByRoomId(@Param("roomId") UUID roomId);
}
