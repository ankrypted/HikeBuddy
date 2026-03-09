package com.hikebuddy.user;

import com.hikebuddy.review.ReviewService;
import com.hikebuddy.review.dto.UserReviewResponse;
import com.hikebuddy.user.dto.PublicUserDto;
import com.hikebuddy.user.dto.UpdatePasswordRequestDto;
import com.hikebuddy.user.dto.UpdateProfileRequestDto;
import com.hikebuddy.user.dto.UpdateProfileResponseDto;
import com.hikebuddy.user.dto.UserProfileDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService   userService;
    private final ReviewService reviewService;

    @GetMapping("/me")
    public UserProfileDto getProfile(@AuthenticationPrincipal UserDetails principal) {
        return userService.getUserProfile(principal.getUsername());
    }

    @GetMapping("/me/reviews")
    public List<UserReviewResponse> getMyReviews(@AuthenticationPrincipal UserDetails principal) {
        return reviewService.getMyReviews(principal.getUsername());
    }

    @GetMapping("/check-username")
    public Map<String, Boolean> checkUsername(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String username) {
        return Map.of("available", userService.isUsernameAvailable(principal.getUsername(), username));
    }

    @PatchMapping("/me")
    public UpdateProfileResponseDto updateProfile(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdateProfileRequestDto dto) {
        return userService.updateProfile(principal.getUsername(), dto);
    }

    @PostMapping(path = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadAvatar(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam("file") MultipartFile file) {
        String url = userService.uploadAvatar(principal.getUsername(), file);
        return Map.of("avatarUrl", url);
    }

    @PutMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updatePassword(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestBody UpdatePasswordRequestDto dto) {
        userService.updatePassword(principal.getUsername(), dto);
    }

    @GetMapping("/public")
    public List<PublicUserDto> getPublicUsers() {
        return userService.getPublicUsers();
    }

    @GetMapping("/{username}/public")
    public PublicUserDto getPublicUserProfile(@PathVariable String username) {
        return userService.getPublicUserProfile(username);
    }

    @PostMapping("/{username}/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void subscribe(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        userService.subscribe(principal.getUsername(), username);
    }

    @DeleteMapping("/{username}/subscribe")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsubscribe(
            @AuthenticationPrincipal UserDetails principal,
            @PathVariable String username) {
        userService.unsubscribe(principal.getUsername(), username);
    }

    @GetMapping("/subscriptions")
    public List<String> getSubscriptions(@AuthenticationPrincipal UserDetails principal) {
        return userService.getSubscribedUsernames(principal.getUsername());
    }

    @GetMapping("/feed")
    public List<PublicUserDto> getFeed(@AuthenticationPrincipal UserDetails principal) {
        return userService.getFeedProfiles(principal.getUsername());
    }
}
