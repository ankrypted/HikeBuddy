package com.hikebuddy.room;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, RoomMemberId> {

    List<RoomMember> findByIdRoomId(UUID roomId);

    boolean existsByIdRoomIdAndIdUserId(UUID roomId, UUID userId);

    int countByIdRoomId(UUID roomId);

    @Query(value = """
            SELECT u.username, u.avatar_url
            FROM room_members m
            INNER JOIN users u ON u.id = m.user_id
            WHERE m.room_id = :roomId
            ORDER BY m.joined_at ASC
            """, nativeQuery = true)
    List<Object[]> findMemberDetails(@Param("roomId") UUID roomId);
}
