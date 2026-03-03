package com.hikebuddy.user;

import com.hikebuddy.storage.S3Service;
import com.hikebuddy.user.dto.UpdatePasswordRequestDto;
import com.hikebuddy.user.dto.UpdateProfileRequestDto;
import com.hikebuddy.user.dto.UserProfileDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final S3Service s3Service;

    public UserProfileDto getUserProfile(String email) {
        return UserProfileDto.from(findByEmail(email));
    }

    @Transactional
    public UserProfileDto updateProfile(String email, UpdateProfileRequestDto dto) {
        User user = findByEmail(email);
        if (dto.bio() != null)       user.setBio(dto.bio());
        if (dto.avatarUrl() != null) user.setAvatarUrl(dto.avatarUrl());
        return UserProfileDto.from(userRepository.save(user));
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

    // ── Helpers ──────────────────────────────────────────────────────────────

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
}
