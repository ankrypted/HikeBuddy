package com.hikebuddy.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    List<Conversation> findByParticipantAOrParticipantBOrderByLastMessageAtDesc(
            String participantA, String participantB);

    Optional<Conversation> findByParticipantAAndParticipantB(String participantA, String participantB);

    @Modifying
    @Query("UPDATE Conversation c SET c.participantA = :newName WHERE c.participantA = :oldName")
    void renameParticipantA(@Param("oldName") String oldName, @Param("newName") String newName);

    @Modifying
    @Query("UPDATE Conversation c SET c.participantB = :newName WHERE c.participantB = :oldName")
    void renameParticipantB(@Param("oldName") String oldName, @Param("newName") String newName);

    /** Deletes orphaned conversations left over from a previous username that was never properly cascaded. */
    @Modifying
    @Query("DELETE FROM Conversation c WHERE c.participantA = :username OR c.participantB = :username")
    void deleteAllByParticipant(@Param("username") String username);
}
