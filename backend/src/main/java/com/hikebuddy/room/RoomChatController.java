package com.hikebuddy.room;

import com.hikebuddy.room.dto.RoomMessageDto;
import com.hikebuddy.room.dto.SendMessageRequest;
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
public class RoomChatController {

    private final RoomService           roomService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{roomId}/chat")
    public void handleMessage(@DestinationVariable UUID roomId,
                              @Payload SendMessageRequest req,
                              Principal principal) {
        // Persist the message (validates membership internally)
        RoomMessageDto msg = roomService.sendMessage(principal.getName(), roomId, req);

        // Broadcast to all room subscribers; client computes mine=true locally via senderUsername
        RoomMessageDto broadcast = new RoomMessageDto(
                msg.id(), msg.senderUsername(), msg.senderAvatarUrl(),
                msg.content(), msg.sentAt(), false);

        messagingTemplate.convertAndSend("/topic/rooms/" + roomId + "/chat", broadcast);
    }
}
