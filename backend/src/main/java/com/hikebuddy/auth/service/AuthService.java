package com.hikebuddy.auth.service;

import com.hikebuddy.auth.dto.AuthResponseDto;
import com.hikebuddy.auth.dto.LoginRequestDto;
import com.hikebuddy.auth.dto.MessageResponseDto;
import com.hikebuddy.auth.dto.RegisterRequestDto;
import com.hikebuddy.auth.dto.UserSummaryDto;
import com.hikebuddy.auth.entity.EmailVerificationToken;
import com.hikebuddy.auth.repository.EmailVerificationTokenRepository;
import com.hikebuddy.security.JwtService;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository                    userRepository;
    private final PasswordEncoder                   passwordEncoder;
    private final JwtService                        jwtService;
    private final EmailVerificationTokenRepository  tokenRepository;
    private final EmailService                      emailService;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    @Transactional
    public MessageResponseDto register(RegisterRequestDto dto) {
        if (userRepository.existsByEmail(dto.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        if (userRepository.existsByUsername(dto.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already taken");
        }

        User user = User.builder()
                .username(dto.username())
                .email(dto.email())
                .passwordHash(passwordEncoder.encode(dto.password()))
                .provider(User.AuthProvider.LOCAL)
                .enabled(false)   // requires email verification
                .build();

        user = userRepository.save(user);

        EmailVerificationToken verificationToken = EmailVerificationToken.builder()
                .user(user)
                .token(UUID.randomUUID())
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        tokenRepository.save(verificationToken);
        emailService.sendVerificationEmail(user.getEmail(), verificationToken.getToken().toString());

        return new MessageResponseDto(
                "Registration successful! Please check your email and click the verification link to activate your account."
        );
    }

    @Transactional
    public MessageResponseDto verifyEmail(String tokenStr) {
        UUID tokenId;
        try {
            tokenId = UUID.fromString(tokenStr);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification token");
        }

        EmailVerificationToken verificationToken = tokenRepository.findByToken(tokenId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Verification token not found or already used"));

        if (verificationToken.isUsed()) {
            throw new ResponseStatusException(HttpStatus.GONE, "This verification link has already been used");
        }

        if (verificationToken.isExpired()) {
            throw new ResponseStatusException(HttpStatus.GONE,
                    "This verification link has expired. Please register again.");
        }

        User user = verificationToken.getUser();
        user.setEnabled(true);
        userRepository.save(user);

        verificationToken.setUsed(true);
        tokenRepository.save(verificationToken);

        return new MessageResponseDto("Email verified successfully! You can now sign in.");
    }

    public AuthResponseDto login(LoginRequestDto dto) {
        User user = userRepository.findByEmail(dto.email())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (user.getPasswordHash() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "This account uses Google Sign-In. Please sign in with Google.");
        }

        if (!passwordEncoder.matches(dto.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Please verify your email before signing in. Check your inbox for the verification link.");
        }

        String token = jwtService.generateToken(user);
        return AuthResponseDto.of(token, expirationMs, UserSummaryDto.from(user), List.copyOf(user.getRoles()));
    }
}
