package com.hikebuddy.messaging;

import com.hikebuddy.messaging.dto.*;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessagingService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("MMM d").withZone(ZoneOffset.UTC);

    private final ConversationRepository convRepo;
    private final MessageRepository      messageRepo;
    private final UserRepository         userRepository;

    // ── Conversation list ─────────────────────────────────────────────────────

    public List<ConversationDto> getConversations(String email) {
        User me = findByEmail(email);
        String myUsername = me.getUsername();
        return convRepo
                .findByParticipantAOrParticipantBOrderByLastMessageAtDesc(myUsername, myUsername)
                .stream()
                .map(c -> toConversationDto(c, myUsername))
                .toList();
    }

    // ── Messages in a conversation ────────────────────────────────────────────

    public List<MessageDto> getMessages(String email, UUID conversationId) {
        User me = findByEmail(email);
        Conversation conv = findConversation(conversationId);
        assertParticipant(conv, me.getUsername());
        return messageRepo.findByConversationIdOrderBySentAtAsc(conversationId)
                .stream()
                .map(m -> toMessageDto(m, me.getUsername()))
                .toList();
    }

    // ── Get or create a conversation with another user ────────────────────────

    @Transactional
    public ConversationDto getOrCreateConversation(String email, String recipientUsername) {
        User me = findByEmail(email);
        String myUsername = me.getUsername();

        if (myUsername.equals(recipientUsername)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot message yourself");
        }
        if (userRepository.findByUsername(recipientUsername).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + recipientUsername);
        }

        // Canonical ordering guarantees exactly one row per pair
        String a = myUsername.compareTo(recipientUsername) < 0 ? myUsername : recipientUsername;
        String b = myUsername.compareTo(recipientUsername) < 0 ? recipientUsername : myUsername;

        Conversation conv = convRepo.findByParticipantAAndParticipantB(a, b)
                .orElseGet(() -> convRepo.save(
                        Conversation.builder()
                                .participantA(a)
                                .participantB(b)
                                .lastMessageAt(Instant.now())
                                .build()));

        return toConversationDto(conv, myUsername);
    }

    // ── Send a message ────────────────────────────────────────────────────────

    @Transactional
    public MessageDto sendMessage(String email, UUID conversationId, SendMessageRequest req) {
        User me = findByEmail(email);
        Conversation conv = findConversation(conversationId);
        assertParticipant(conv, me.getUsername());

        if (req.body() == null || req.body().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message body cannot be empty");
        }

        // saveAndFlush ensures @CreationTimestamp is populated before we read sentAt
        Message msg = messageRepo.saveAndFlush(Message.builder()
                .conversationId(conversationId)
                .senderUsername(me.getUsername())
                .body(req.body().trim())
                .build());

        Instant ts = msg.getSentAt() != null ? msg.getSentAt() : Instant.now();
        conv.setLastMessageAt(ts);
        convRepo.save(conv);

        return toMessageDto(msg, me.getUsername());
    }

    // ── Mark all messages in a conversation as read ───────────────────────────

    @Transactional
    public void markRead(String email, UUID conversationId) {
        User me = findByEmail(email);
        Conversation conv = findConversation(conversationId);
        assertParticipant(conv, me.getUsername());
        messageRepo.markReadForRecipient(conversationId, me.getUsername(), Instant.now());
    }

    // ── Total unread count for the FAB badge ──────────────────────────────────

    public long getTotalUnread(String email) {
        User me = findByEmail(email);
        return messageRepo.countUnreadForUser(me.getUsername());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private ConversationDto toConversationDto(Conversation c, String myUsername) {
        String other = c.getParticipantA().equals(myUsername) ? c.getParticipantB() : c.getParticipantA();
        String avatarUrl = userRepository.findByUsername(other).map(User::getAvatarUrl).orElse(null);
        Message lastMsg = messageRepo.findTopByConversationIdOrderBySentAtDesc(c.getId()).orElse(null);
        long unread = messageRepo.countByConversationIdAndSenderUsernameNotAndReadAtIsNull(c.getId(), myUsername);
        return new ConversationDto(
                c.getId().toString(),
                other,
                avatarUrl,
                lastMsg != null ? lastMsg.getBody() : "",
                lastMsg != null ? formatRelative(lastMsg.getSentAt()) : "",
                (int) unread);
    }

    private MessageDto toMessageDto(Message m, String myUsername) {
        Instant ts = m.getSentAt() != null ? m.getSentAt() : Instant.now();
        return new MessageDto(
                m.getId().toString(),
                m.getSenderUsername(),
                m.getBody(),
                ts.toString(),   // ISO-8601 UTC — browser formats in user's local timezone
                m.getSenderUsername().equals(myUsername));
    }

    private String formatRelative(Instant ts) {
        long secs = Instant.now().getEpochSecond() - ts.getEpochSecond();
        if (secs < 60)      return "Just now";
        if (secs < 3600)    return (secs / 60) + "m";
        if (secs < 86_400)  return (secs / 3600) + "h";
        if (secs < 604_800) return (secs / 86_400) + "d";
        return DATE_FMT.format(ts);
    }

    private Conversation findConversation(UUID id) {
        return convRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"));
    }

    private void assertParticipant(Conversation conv, String username) {
        if (!conv.getParticipantA().equals(username) && !conv.getParticipantB().equals(username)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                        "Authenticated user not found: " + email));
    }
}
