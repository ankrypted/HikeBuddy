package com.hikebuddy.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        log.debug("[JWT] {} {} | Authorization: {}",
                request.getMethod(), request.getRequestURI(),
                authHeader != null ? (authHeader.startsWith("Bearer ") ? "Bearer <present>" : "non-Bearer") : "MISSING");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            log.warn("[JWT] Invalid token for {} {}", request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            String email = jwtService.extractAllClaims(token).get("email", String.class);
            log.debug("[JWT] Authenticating email='{}' for {} {}",
                    email, request.getMethod(), request.getRequestURI());
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                var authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("[JWT] Authentication SET for email='{}' {} {}",
                        email, request.getMethod(), request.getRequestURI());
            } catch (UsernameNotFoundException e) {
                // Token is valid but user no longer exists in the DB.
                // Do NOT propagate — UsernameNotFoundException extends AuthenticationException,
                // which ExceptionTranslationFilter would convert to 401. Instead, let the
                // request continue unauthenticated; the AuthorizationFilter will reject it cleanly.
                log.warn("[JWT] User not found for token email='{}' — {} {}",
                        email, request.getMethod(), request.getRequestURI());
            }
        }

        filterChain.doFilter(request, response);
    }
}
