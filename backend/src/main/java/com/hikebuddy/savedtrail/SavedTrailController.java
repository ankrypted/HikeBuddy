package com.hikebuddy.savedtrail;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users/me/saved-trails")
@RequiredArgsConstructor
public class SavedTrailController {

    private final SavedTrailService service;

    /** GET /api/v1/users/me/saved-trails → ["grand-canyon-rim", "rocky-mountain-loop", …] */
    @GetMapping
    public List<String> getSavedTrails(Authentication auth) {
        return service.getSavedTrailIds(auth.getName());
    }

    /** POST /api/v1/users/me/saved-trails  body: { "trailId": "grand-canyon-rim" } */
    @PostMapping
    public ResponseEntity<Void> saveTrail(
            Authentication auth,
            @RequestBody Map<String, String> body) {

        String trailId = body.get("trailId");
        if (trailId == null || trailId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        service.saveTrail(auth.getName(), trailId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    /** DELETE /api/v1/users/me/saved-trails/{trailId} */
    @DeleteMapping("/{trailId}")
    public ResponseEntity<Void> removeTrail(
            Authentication auth,
            @PathVariable String trailId) {

        service.removeTrail(auth.getName(), trailId);
        return ResponseEntity.noContent().build();
    }
}
