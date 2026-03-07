package com.hikebuddy.notification;

import com.hikebuddy.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    /** GET /api/v1/notifications */
    @GetMapping
    public List<NotificationDto> getNotifications(Authentication auth) {
        return service.getNotifications(auth.getName());
    }

    /** GET /api/v1/notifications/unread-count */
    @GetMapping("/unread-count")
    public long getUnreadCount(Authentication auth) {
        return service.getUnreadCount(auth.getName());
    }

    /** PUT /api/v1/notifications/read-all */
    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        service.markAllRead(auth.getName());
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/v1/notifications/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismiss(Authentication auth, @PathVariable UUID id) {
        service.dismiss(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
