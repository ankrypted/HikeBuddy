package com.hikebuddy.completedtrail;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/me/completed-trails")
@RequiredArgsConstructor
public class CompletedTrailController {

    private final CompletedTrailService service;

    /** GET /api/v1/users/me/completed-trails → ["roopkund", "hampta-pass", …] */
    @GetMapping
    public List<String> getCompletedTrails(Authentication auth) {
        return service.getCompletedTrailIds(auth.getName());
    }

    /** POST /api/v1/users/me/completed-trails  body: { "trailId": "roopkund" } */
    @PostMapping
    public ResponseEntity<Void> markComplete(
            Authentication auth,
            @RequestBody Map<String, String> body) {

        String trailId = body.get("trailId");
        if (trailId == null || trailId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        service.markComplete(auth.getName(), trailId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** DELETE /api/v1/users/me/completed-trails/{trailId} */
    @DeleteMapping("/{trailId}")
    public ResponseEntity<Void> unmarkComplete(
            Authentication auth,
            @PathVariable String trailId) {

        service.unmarkComplete(auth.getName(), trailId);
        return ResponseEntity.noContent().build();
    }
}
