package com.hikebuddy.messaging;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    List<Conversation> findByParticipantAOrParticipantBOrderByLastMessageAtDesc(
            String participantA, String participantB);

    Optional<Conversation> findByParticipantAAndParticipantB(String participantA, String participantB);
}
