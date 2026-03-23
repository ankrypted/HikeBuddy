package com.hikebuddy.hikepost;

import com.hikebuddy.hikepost.dto.CreateHikePostRequest;
import com.hikebuddy.hikepost.dto.HikePostResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/hike-posts")
@RequiredArgsConstructor
public class HikePostController {

    private final HikePostService service;

    /** Create a new hike post. Authenticated. */
    @PostMapping
    public ResponseEntity<HikePostResponse> create(
            Authentication auth,
            @Valid @RequestBody CreateHikePostRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(auth.getName(), request));
    }

    /** Feed: posts from users the caller follows. Authenticated. */
    @GetMapping("/feed")
    public List<HikePostResponse> getFeed(Authentication auth) {
        return service.getFeed(auth.getName());
    }

    /** Posts by a specific user. Public. */
    @GetMapping("/user/{username}")
    public List<HikePostResponse> getUserPosts(@PathVariable String username) {
        return service.getUserPosts(username);
    }

    /** Delete own post. Authenticated. */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, Authentication auth) {
        service.delete(auth.getName(), id);
    }
}
