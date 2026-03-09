package com.hikebuddy.user;

import com.hikebuddy.completedtrail.UserCompletedTrailRepository;
import com.hikebuddy.notification.NotificationService;
import com.hikebuddy.subscription.UserSubscription;
import com.hikebuddy.subscription.UserSubscriptionId;
import com.hikebuddy.subscription.UserSubscriptionRepository;
import com.hikebuddy.review.TrailReview;
import com.hikebuddy.review.TrailReviewRepository;
import com.hikebuddy.savedtrail.UserSavedTrail;
import com.hikebuddy.savedtrail.UserSavedTrailRepository;
import com.hikebuddy.messaging.ConversationRepository;
import com.hikebuddy.messaging.MessageRepository;
import com.hikebuddy.storage.S3Service;
import com.hikebuddy.security.JwtService;
import com.hikebuddy.user.dto.ActivityEventDto;
import com.hikebuddy.user.dto.PublicUserDto;
import com.hikebuddy.user.dto.UpdatePasswordRequestDto;
import com.hikebuddy.user.dto.UpdateProfileRequestDto;
import com.hikebuddy.user.dto.UpdateProfileResponseDto;
import com.hikebuddy.user.dto.UserProfileDto;
import com.hikebuddy.completedtrail.UserCompletedTrail;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service;
    private final JwtService jwtService;
    private final UserCompletedTrailRepository completedTrailRepository;
    private final TrailReviewRepository reviewRepository;
    private final UserSavedTrailRepository savedTrailRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final NotificationService notificationService;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public UserProfileDto getUserProfile(String email) {
        return UserProfileDto.from(findByEmail(email));
    }

    /** Returns true if {@code username} is free to use (not taken by anyone other than the caller). */
    public boolean isUsernameAvailable(String callerEmail, String username) {
        User caller = findByEmail(callerEmail);
        if (caller.getUsername().equals(username)) return true;   // it's already theirs
        return !userRepository.existsByUsername(username);
    }

    @Transactional
    public UpdateProfileResponseDto updateProfile(String email, UpdateProfileRequestDto dto) {
        User user = findByEmail(email);
        boolean usernameChanged = false;

        String oldUsername = user.getUsername();

        if (dto.username() != null) {
            String newUsername = dto.username().trim();
            if (!newUsername.equals(oldUsername)) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
                }
                user.setUsername(newUsername);
                usernameChanged = true;
            }
        }
        if (dto.bio() != null)       user.setBio(dto.bio());
        if (dto.avatarUrl() != null) user.setAvatarUrl(dto.avatarUrl());

        User saved = userRepository.save(user);

        if (usernameChanged) {
            String newUsername = saved.getUsername();
            try {
                // Remove any orphaned rows that used the new username before the cascade fix existed
                messageRepository.deleteAllByConversationParticipant(newUsername);
                conversationRepository.deleteAllByParticipant(newUsername);
                // Now safely rename
                conversationRepository.renameParticipantA(oldUsername, newUsername);
                conversationRepository.renameParticipantB(oldUsername, newUsername);
                messageRepository.renameSender(oldUsername, newUsername);
            } catch (DataIntegrityViolationException e) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Username could not be updated due to a data conflict. Please contact support.");
            }
        }

        String newToken = usernameChanged ? jwtService.generateToken(saved) : null;
        return new UpdateProfileResponseDto(UserProfileDto.from(saved), newToken);
    }

    @Transactional
    public void updatePassword(String email, UpdatePasswordRequestDto dto) {
        User user = findByEmail(email);

        if (user.getProvider() != User.AuthProvider.LOCAL) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Password change is not available for OAuth accounts");
        }
        if (!passwordEncoder.matches(dto.currentPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(dto.newPassword()));
        userRepository.save(user);
    }

    @Transactional
    public String uploadAvatar(String email, MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
        }
        if (file.getSize() > 5L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must be under 5 MB");
        }
        User user = findByEmail(email);
        try {
            String url = s3Service.uploadAvatar(file, user.getId().toString());
            user.setAvatarUrl(url);
            userRepository.save(user);
            return url;
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload failed");
        }
    }

    @Transactional
    public void subscribe(String followerEmail, String followeeUsername) {
        User follower = findByEmail(followerEmail);
        User followee = userRepository.findByUsername(followeeUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if (follower.getId().equals(followee.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot subscribe to yourself");
        }
        UserSubscriptionId id = new UserSubscriptionId(follower.getId(), followee.getId());
        if (!subscriptionRepository.existsById(id)) {
            subscriptionRepository.save(UserSubscription.builder().id(id).build());
            notificationService.createSubscriptionNotification(followee.getUsername(), follower);
        }
    }

    @Transactional
    public void unsubscribe(String followerEmail, String followeeUsername) {
        User follower = findByEmail(followerEmail);
        User followee = userRepository.findByUsername(followeeUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        subscriptionRepository.deleteById(new UserSubscriptionId(follower.getId(), followee.getId()));
    }

    public List<String> getSubscribedUsernames(String email) {
        User follower = findByEmail(email);
        return subscriptionRepository.findFolloweeIdsByFollowerId(follower.getId()).stream()
                .flatMap(id -> userRepository.findById(id).stream())
                .map(User::getUsername)
                .toList();
    }

    public List<PublicUserDto> getFeedProfiles(String email) {
        User follower = findByEmail(email);
        return subscriptionRepository.findFolloweeIdsByFollowerId(follower.getId()).stream()
                .flatMap(id -> userRepository.findById(id).stream())
                .map(u -> PublicUserDto.from(u,
                        completedTrailRepository.countByUserId(u.getId()),
                        reviewRepository.countByUserId(u.getId()),
                        savedTrailRepository.countByUserId(u.getId()),
                        subscriptionRepository.countByIdFolloweeId(u.getId()),
                        completedTrailRepository.findTrailIdsByUserId(u.getId()),
                        buildActivityEvents(u.getId())))
                .toList();
    }

    public List<PublicUserDto> getPublicUsers() {
        return userRepository.findAll().stream()
                .map(u -> PublicUserDto.from(u,
                        completedTrailRepository.countByUserId(u.getId()),
                        reviewRepository.countByUserId(u.getId()),
                        savedTrailRepository.countByUserId(u.getId()),
                        subscriptionRepository.countByIdFolloweeId(u.getId()),
                        List.of(),
                        List.of()))
                .toList();
    }

    public PublicUserDto getPublicUserProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        List<String> trailIds = completedTrailRepository.findTrailIdsByUserId(user.getId());
        List<ActivityEventDto> activity = buildActivityEvents(user.getId());
        return PublicUserDto.from(user,
                trailIds.size(),
                reviewRepository.countByUserId(user.getId()),
                savedTrailRepository.countByUserId(user.getId()),
                subscriptionRepository.countByIdFolloweeId(user.getId()),
                trailIds,
                activity);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private List<ActivityEventDto> buildActivityEvents(UUID userId) {
        List<ActivityEventDto> events = new ArrayList<>();

        for (UserCompletedTrail c : completedTrailRepository.findById_UserIdOrderByCompletedAtDesc(userId)) {
            events.add(new ActivityEventDto(
                    "c-" + c.getId().getTrailId(),
                    "completed",
                    c.getCompletedAt(),
                    c.getId().getTrailId(),
                    null,
                    null));
        }

        for (TrailReview r : reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)) {
            events.add(new ActivityEventDto(
                    r.getId().toString(),
                    "reviewed",
                    r.getCreatedAt(),
                    r.getTrailId(),
                    (int) r.getRating(),
                    r.getComment()));
        }

        for (UserSavedTrail s : savedTrailRepository.findById_UserIdOrderBySavedAtDesc(userId)) {
            events.add(new ActivityEventDto(
                    "s-" + s.getId().getTrailId(),
                    "saved",
                    s.getSavedAt(),
                    s.getId().getTrailId(),
                    null,
                    null));
        }

        events.sort((a, b) -> b.timestamp().compareTo(a.timestamp()));
        return events.stream().limit(20).toList();
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
