package com.hikebuddy.user;

import com.hikebuddy.user.dto.UpdatePasswordRequestDto;
import com.hikebuddy.user.dto.UpdateProfileRequestDto;
import com.hikebuddy.user.dto.UserProfileDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileDto getProfile(@AuthenticationPrincipal UserDetails principal) {
        return userService.getUserProfile(principal.getUsername());
    }

    @PatchMapping("/me")
    public UserProfileDto updateProfile(
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
}
