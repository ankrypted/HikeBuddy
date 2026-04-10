package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoomJoinRequestRepository extends JpaRepository<RoomJoinRequest, UUID> {

    Optional<RoomJoinRequest> findByRoomIdAndRequesterIdAndStatus(UUID roomId, UUID requesterId, String status);

    @Transactional
    void deleteByRoomIdAndRequesterId(UUID roomId, UUID requesterId);

    boolean existsByRoomIdAndRequesterIdAndStatus(UUID roomId, UUID requesterId, String status);
}
