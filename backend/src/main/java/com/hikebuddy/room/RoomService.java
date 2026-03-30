package com.hikebuddy.room;

import com.hikebuddy.hikepost.HikePost;
import com.hikebuddy.hikepost.HikePostService;
import com.hikebuddy.notification.Notification;
import com.hikebuddy.notification.NotificationService;
import com.hikebuddy.room.dto.*;
import com.hikebuddy.subscription.UserSubscriptionId;
import com.hikebuddy.subscription.UserSubscriptionRepository;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository           roomRepo;
    private final RoomMemberRepository     memberRepo;
    private final RoomMessageRepository    messageRepo;
    private final RoomUpdateRepository     updateRepo;
    private final UserRepository           userRepo;
    private final UserSubscriptionRepository subscriptionRepo;
    private final HikePostService          hikePostService;
    private final NotificationService      notificationService;

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public RoomDetailDto createRoom(String email, CreateRoomRequest req) {
        User creator = requireUser(email);

        Room room = Room.builder()
                .creatorId(creator.getId())
                .trailId(req.trailId())
                .trailName(req.trailName())
                .plannedDate(req.plannedDate())
                .title(req.title())
                .status("OPEN")
                .build();
        room = roomRepo.saveAndFlush(room);

        // Auto-join creator
        memberRepo.save(new RoomMember(new RoomMemberId(room.getId(), creator.getId()), null));

        // Create feed post
        HikePost post = hikePostService.createForRoom(creator, room);
        room.setFeedPostId(post.getId());
        roomRepo.save(room);

        return toDetail(room, creator.getUsername());
    }

    // ── Join ──────────────────────────────────────────────────────────────────

    @Transactional
    public RoomDetailDto joinRoom(String email, UUID roomId) {
        User user = requireUser(email);
        Room room = requireRoom(roomId);
        if (!"OPEN".equals(room.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room is closed");
        }
        RoomMemberId memberId = new RoomMemberId(roomId, user.getId());
        if (!memberRepo.existsById(memberId)) {
            memberRepo.save(new RoomMember(memberId, null));
        }
        String creatorUsername = userRepo.findById(room.getCreatorId())
                .map(User::getUsername).orElse("unknown");
        return toDetail(room, creatorUsername);
    }

    // ── Invite ────────────────────────────────────────────────────────────────

    @Transactional
    public void inviteToRoom(String email, UUID roomId, InviteRequest req) {
        User actor   = requireUser(email);
        Room room    = requireRoom(roomId);

        if (!room.getCreatorId().equals(actor.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the room creator can send invites");
        }

        User invitee = userRepo.findByUsername(req.username())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Invitee must follow the creator
        boolean follows = subscriptionRepo.existsById(
                new UserSubscriptionId(invitee.getId(), actor.getId()));
        if (!follows) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only invite your followers");
        }

        notificationService.createNotification(
                invitee.getUsername(),
                actor,
                Notification.NotificationType.ROOM_INVITE,
                actor.getUsername(),
                roomId.toString(),
                room.getTrailName(),
                "room_invite"
        );
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RoomDetailDto getRoom(UUID roomId, String email) {
        User user = requireUser(email);
        Room room = requireRoom(roomId);
        assertMember(roomId, user.getId());
        String creatorUsername = userRepo.findById(room.getCreatorId())
                .map(User::getUsername).orElse("unknown");
        return toDetail(room, creatorUsername);
    }

    @Transactional(readOnly = true)
    public List<RoomSummaryDto> getMyRooms(String email) {
        User user = requireUser(email);
        return roomRepo.findByMember(user.getId()).stream()
                .map(r -> toSummary(r, resolveCreatorUsername(r)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomSummaryDto> getRoomsForTrail(String trailSlug) {
        return roomRepo.findByTrailIdAndStatusOrderByPlannedDateAsc(trailSlug, "OPEN").stream()
                .map(r -> toSummary(r, resolveCreatorUsername(r)))
                .toList();
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    @Transactional
    public RoomMessageDto sendMessage(String email, UUID roomId, SendMessageRequest req) {
        User user = requireUser(email);
        assertMember(roomId, user.getId());

        RoomMessage msg = RoomMessage.builder()
                .roomId(roomId)
                .senderId(user.getId())
                .senderUsername(user.getUsername())
                .senderAvatarUrl(user.getAvatarUrl())
                .content(req.content())
                .build();
        msg = messageRepo.saveAndFlush(msg);
        return toMessageDto(msg, true);
    }

    @Transactional(readOnly = true)
    public List<RoomMessageDto> getMessages(String email, UUID roomId, Instant since) {
        User user = requireUser(email);
        assertMember(roomId, user.getId());

        List<RoomMessage> msgs = since != null
                ? messageRepo.findByRoomIdAndSentAtAfterOrderBySentAtAsc(roomId, since)
                : reverseForDisplay(messageRepo.findRecent(roomId));

        return msgs.stream()
                .map(m -> toMessageDto(m, m.getSenderId().equals(user.getId())))
                .toList();
    }

    // ── Updates ───────────────────────────────────────────────────────────────

    @Transactional
    public RoomUpdateDto postUpdate(String email, UUID roomId, CreateUpdateRequest req) {
        User user = requireUser(email);
        assertMember(roomId, user.getId());
        Room room = requireRoom(roomId);

        RoomUpdate update = RoomUpdate.builder()
                .roomId(roomId)
                .authorId(user.getId())
                .authorUsername(user.getUsername())
                .content(req.content())
                .build();
        update = updateRepo.saveAndFlush(update);
        return toUpdateDto(update, room);
    }

    @Transactional(readOnly = true)
    public List<RoomUpdateDto> getUpdates(String email, UUID roomId) {
        User user = requireUser(email);
        assertMember(roomId, user.getId());
        Room room = requireRoom(roomId);
        return updateRepo.findByRoomIdOrderByCreatedAtDesc(roomId).stream()
                .map(u -> toUpdateDto(u, room))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RoomUpdateDto> getUpdatesForTrail(String trailSlug) {
        return updateRepo.findRecentByTrailSlug(trailSlug).stream()
                .map(u -> {
                    Room room = roomRepo.findById(u.getRoomId()).orElse(null);
                    return toUpdateDto(u, room);
                })
                .toList();
    }

    // ── Followers (for invite panel) ─────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RoomDetailDto.MemberDto> getMyFollowers(String email) {
        User user = requireUser(email);
        List<UUID> followerIds = subscriptionRepo.findFollowerIdsByFolloweeId(user.getId());
        return userRepo.findAllById(followerIds).stream()
                .map(u -> new RoomDetailDto.MemberDto(u.getUsername(), u.getAvatarUrl()))
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User requireUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.INTERNAL_SERVER_ERROR, "Authenticated user not found"));
    }

    private Room requireRoom(UUID id) {
        return roomRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found"));
    }

    private void assertMember(UUID roomId, UUID userId) {
        if (!memberRepo.existsByIdRoomIdAndIdUserId(roomId, userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this room");
        }
    }

    private String resolveCreatorUsername(Room r) {
        return userRepo.findById(r.getCreatorId()).map(User::getUsername).orElse("unknown");
    }

    private RoomDetailDto toDetail(Room room, String creatorUsername) {
        List<Object[]> rows = memberRepo.findMemberDetails(room.getId());
        List<RoomDetailDto.MemberDto> members = rows.stream()
                .map(row -> new RoomDetailDto.MemberDto(
                        (String) row[0],
                        (String) row[1]))
                .toList();
        return new RoomDetailDto(
                room.getId().toString(),
                room.getTrailId(),
                room.getTrailName(),
                room.getPlannedDate().toString(),
                room.getTitle(),
                room.getStatus(),
                creatorUsername,
                members,
                members.size(),
                room.getCreatedAt().toString()
        );
    }

    private RoomSummaryDto toSummary(Room room, String creatorUsername) {
        int count = memberRepo.countByIdRoomId(room.getId());
        return new RoomSummaryDto(
                room.getId().toString(),
                room.getTrailId(),
                room.getTrailName(),
                room.getPlannedDate().toString(),
                room.getTitle(),
                room.getStatus(),
                creatorUsername,
                count,
                room.getCreatedAt().toString()
        );
    }

    private RoomMessageDto toMessageDto(RoomMessage m, boolean mine) {
        return new RoomMessageDto(
                m.getId().toString(),
                m.getSenderUsername(),
                m.getSenderAvatarUrl(),
                m.getContent(),
                m.getSentAt().toString(),
                mine
        );
    }

    private RoomUpdateDto toUpdateDto(RoomUpdate u, Room room) {
        return new RoomUpdateDto(
                u.getId().toString(),
                u.getRoomId().toString(),
                room != null ? room.getTitle() : "",
                room != null ? room.getTrailId() : "",
                u.getAuthorUsername(),
                u.getContent(),
                u.getCreatedAt().toString()
        );
    }

    private List<RoomMessage> reverseForDisplay(List<RoomMessage> msgs) {
        List<RoomMessage> result = new ArrayList<>(msgs);
        java.util.Collections.reverse(result);
        return result;
    }
}
