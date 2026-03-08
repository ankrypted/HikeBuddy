package com.hikebuddy.messaging;

import com.hikebuddy.messaging.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
public class MessagingController {

    private final MessagingService service;

    /** GET /api/v1/messages/conversations — list all conversations for the logged-in user */
    @GetMapping("/conversations")
    public List<ConversationDto> getConversations(Authentication auth) {
        return service.getConversations(auth.getName());
    }

    /** GET /api/v1/messages/conversations/{id} — messages in a conversation */
    @GetMapping("/conversations/{id}")
    public List<MessageDto> getMessages(Authentication auth, @PathVariable UUID id) {
        return service.getMessages(auth.getName(), id);
    }

    /** POST /api/v1/messages/conversations/with/{username} — get or create conversation */
    @PostMapping("/conversations/with/{username}")
    public ResponseEntity<ConversationDto> getOrCreate(Authentication auth,
                                                       @PathVariable String username) {
        ConversationDto dto = service.getOrCreateConversation(auth.getName(), username);
        return ResponseEntity.status(HttpStatus.OK).body(dto);
    }

    /** POST /api/v1/messages/conversations/{id} — send a message */
    @PostMapping("/conversations/{id}")
    public ResponseEntity<MessageDto> sendMessage(Authentication auth,
                                                  @PathVariable UUID id,
                                                  @RequestBody SendMessageRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.sendMessage(auth.getName(), id, req));
    }

    /** PUT /api/v1/messages/conversations/{id}/read — mark conversation as read */
    @PutMapping("/conversations/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable UUID id) {
        service.markRead(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/v1/messages/unread-count — total unread across all conversations */
    @GetMapping("/unread-count")
    public long unreadCount(Authentication auth) {
        return service.getTotalUnread(auth.getName());
    }
}
