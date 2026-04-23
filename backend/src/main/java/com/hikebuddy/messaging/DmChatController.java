package com.hikebuddy.messaging;

import com.hikebuddy.messaging.dto.MessageDto;
import com.hikebuddy.messaging.dto.SendMessageRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class DmChatController {

    private final MessagingService      messagingService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/dm/{conversationId}")
    public void handleMessage(@DestinationVariable UUID conversationId,
                              @Payload SendMessageRequest req,
                              Principal principal) {
        MessageDto msg = messagingService.sendMessage(principal.getName(), conversationId, req);

        // Broadcast to both participants; client computes mine=true via senderUsername
        MessageDto broadcast = new MessageDto(
                msg.id(), msg.senderUsername(), msg.body(), msg.sentAt(), false);

        messagingTemplate.convertAndSend("/topic/dm/" + conversationId, broadcast);
    }
}
