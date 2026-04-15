package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomJoinRequestRepository extends JpaRepository<RoomJoinRequest, UUID> {

    Optional<RoomJoinRequest> findByRoomIdAndRequesterIdAndStatus(UUID roomId, UUID requesterId, String status);

    @Modifying
    @Transactional
    @Query("DELETE FROM RoomJoinRequest r WHERE r.roomId = :roomId AND r.requesterId = :requesterId")
    void deleteByRoomIdAndRequesterId(@Param("roomId") UUID roomId, @Param("requesterId") UUID requesterId);

    @Modifying
    @Transactional
    @Query("DELETE FROM RoomJoinRequest r WHERE r.roomId = :roomId")
    void deleteByRoomId(@Param("roomId") UUID roomId);

    boolean existsByRoomIdAndRequesterIdAndStatus(UUID roomId, UUID requesterId, String status);
}
