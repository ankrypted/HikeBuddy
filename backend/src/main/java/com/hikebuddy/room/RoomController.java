package com.hikebuddy.room;

import com.hikebuddy.room.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoomDetailDto create(@AuthenticationPrincipal UserDetails user,
                                @Valid @RequestBody CreateRoomRequest req) {
        return roomService.createRoom(user.getUsername(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRoom(@AuthenticationPrincipal UserDetails user,
                           @PathVariable UUID id) {
        roomService.deleteRoom(user.getUsername(), id);
    }

    @GetMapping("/my")
    public List<RoomSummaryDto> myRooms(@AuthenticationPrincipal UserDetails user) {
        return roomService.getMyRooms(user.getUsername());
    }

    @GetMapping("/open")
    public List<RoomSummaryDto> openRooms() {
        return roomService.getOpenRooms();
    }

    @GetMapping("/trail/{slug}")
    public List<RoomSummaryDto> forTrail(@PathVariable String slug) {
        return roomService.getRoomsForTrail(slug);
    }

    @GetMapping("/updates/trail/{slug}")
    public List<RoomUpdateDto> updatesForTrail(@PathVariable String slug) {
        return roomService.getUpdatesForTrail(slug);
    }

    @GetMapping("/{id}")
    public RoomDetailDto getRoom(@AuthenticationPrincipal UserDetails user,
                                 @PathVariable UUID id) {
        return roomService.getRoom(id, user != null ? user.getUsername() : null);
    }

    @PostMapping("/{id}/join")
    public RoomDetailDto join(@AuthenticationPrincipal UserDetails user,
                              @PathVariable UUID id) {
        return roomService.joinRoom(user.getUsername(), id);
    }

    @DeleteMapping("/{id}/members/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leaveRoom(@AuthenticationPrincipal UserDetails user,
                          @PathVariable UUID id) {
        roomService.leaveRoom(user.getUsername(), id);
    }

    @PostMapping("/{id}/invite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void invite(@AuthenticationPrincipal UserDetails user,
                       @PathVariable UUID id,
                       @Valid @RequestBody InviteRequest req) {
        roomService.inviteToRoom(user.getUsername(), id, req);
    }

    @GetMapping("/{id}/messages")
    public List<RoomMessageDto> getMessages(@AuthenticationPrincipal UserDetails user,
                                             @PathVariable UUID id,
                                             @RequestParam(required = false) String since) {
        Instant sinceInstant = since != null ? Instant.parse(since) : null;
        return roomService.getMessages(user.getUsername(), id, sinceInstant);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomMessageDto sendMessage(@AuthenticationPrincipal UserDetails user,
                                       @PathVariable UUID id,
                                       @Valid @RequestBody SendMessageRequest req) {
        return roomService.sendMessage(user.getUsername(), id, req);
    }

    @GetMapping("/my-followers")
    public List<RoomDetailDto.MemberDto> myFollowers(@AuthenticationPrincipal UserDetails user) {
        return roomService.getMyFollowers(user.getUsername());
    }

    @GetMapping("/{id}/updates")
    public List<RoomUpdateDto> getUpdates(@AuthenticationPrincipal UserDetails user,
                                           @PathVariable UUID id) {
        return roomService.getUpdates(user.getUsername(), id);
    }

    @PostMapping("/{id}/updates")
    @ResponseStatus(HttpStatus.CREATED)
    public RoomUpdateDto postUpdate(@AuthenticationPrincipal UserDetails user,
                                     @PathVariable UUID id,
                                     @Valid @RequestBody CreateUpdateRequest req) {
        return roomService.postUpdate(user.getUsername(), id, req);
    }
}
