package com.hikebuddy.auth.controller;

import com.hikebuddy.auth.dto.AuthResponseDto;
import com.hikebuddy.auth.dto.LoginRequestDto;
import com.hikebuddy.auth.dto.MessageResponseDto;
import com.hikebuddy.auth.dto.RegisterRequestDto;
import com.hikebuddy.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public MessageResponseDto register(@Valid @RequestBody RegisterRequestDto dto) {
        return authService.register(dto);
    }

    @GetMapping("/verify-email")
    public MessageResponseDto verifyEmail(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    @PostMapping("/login")
    public AuthResponseDto login(@Valid @RequestBody LoginRequestDto dto) {
        return authService.login(dto);
    }
}
