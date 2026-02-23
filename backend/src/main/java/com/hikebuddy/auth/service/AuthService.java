package com.hikebuddy.auth.service;

import com.hikebuddy.auth.dto.AuthResponseDto;
import com.hikebuddy.auth.dto.LoginRequestDto;
import com.hikebuddy.auth.dto.RegisterRequestDto;
import com.hikebuddy.auth.dto.UserSummaryDto;
import com.hikebuddy.security.JwtService;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository   userRepository;
    private final PasswordEncoder  passwordEncoder;
    private final JwtService       jwtService;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    public AuthResponseDto register(RegisterRequestDto dto) {
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
                .build();

        user = userRepository.save(user);
        String token = jwtService.generateToken(user);
        return AuthResponseDto.of(token, expirationMs, UserSummaryDto.from(user), List.copyOf(user.getRoles()));
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

        String token = jwtService.generateToken(user);
        return AuthResponseDto.of(token, expirationMs, UserSummaryDto.from(user), List.copyOf(user.getRoles()));
    }
}
