package com.hikebuddy.messaging;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderBySentAtAsc(UUID conversationId);

    Optional<Message> findTopByConversationIdOrderBySentAtDesc(UUID conversationId);

    long countByConversationIdAndSenderUsernameNotAndReadAtIsNull(UUID conversationId, String senderUsername);

    @Query(value = """
            SELECT COUNT(m.*) FROM message m
            JOIN conversation c ON m.conversation_id = c.id
            WHERE m.read_at IS NULL
              AND m.sender_username <> :username
              AND (c.participant_a = :username OR c.participant_b = :username)
            """, nativeQuery = true)
    long countUnreadForUser(@Param("username") String username);

    @Modifying
    @Query("UPDATE Message m SET m.readAt = :readAt WHERE m.conversationId = :conversationId AND m.senderUsername <> :recipient AND m.readAt IS NULL")
    void markReadForRecipient(@Param("conversationId") UUID conversationId,
                               @Param("recipient") String recipient,
                               @Param("readAt") Instant readAt);

    @Modifying
    @Query("UPDATE Message m SET m.senderUsername = :newName WHERE m.senderUsername = :oldName")
    void renameSender(@Param("oldName") String oldName, @Param("newName") String newName);

    /** Deletes orphaned messages in conversations that belong to a stale participant username. */
    @Modifying
    @Query("DELETE FROM Message m WHERE m.conversationId IN " +
           "(SELECT c.id FROM Conversation c WHERE c.participantA = :username OR c.participantB = :username)")
    void deleteAllByConversationParticipant(@Param("username") String username);
}
