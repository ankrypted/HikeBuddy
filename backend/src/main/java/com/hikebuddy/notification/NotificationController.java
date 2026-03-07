package com.hikebuddy.notification;

import com.hikebuddy.notification.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
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

    /** GET /api/v1/notifications/all?page=0&size=20 */
    @GetMapping("/all")
    public Page<NotificationDto> getAllPaged(
            Authentication auth,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.getAllPaged(auth.getName(), pageable);
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

    /** PUT /api/v1/notifications/{id}/read */
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication auth, @PathVariable UUID id) {
        service.markRead(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }

    /** DELETE /api/v1/notifications/{id} */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> dismiss(Authentication auth, @PathVariable UUID id) {
        service.dismiss(auth.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
