package com.hikebuddy.config;

import com.hikebuddy.auth.oauth2.CustomOAuth2UserService;
import com.hikebuddy.auth.oauth2.HttpCookieOAuth2AuthorizationRequestRepository;
import com.hikebuddy.auth.oauth2.OAuth2AuthenticationSuccessHandler;
import com.hikebuddy.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter                                  jwtAuthFilter;
    private final CustomOAuth2UserService                        oAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler             oAuth2SuccessHandler;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieAuthRequestRepository;
    private final CorsConfigurationSource                        corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        // Return 401 for unauthenticated API calls instead of redirecting
                        // to OAuth2. Without this, oauth2Login() would send a 302 →
                        // /oauth2/authorization/google which the browser rejects as an
                        // illegal response to a CORS preflight.
                        .authenticationEntryPoint((req, res, exc) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized"))
                )
                .authorizeHttpRequests(auth -> auth
                        // Allow CORS preflight requests through before any auth check.
                        // AntPathRequestMatcher bypasses Spring Security 6's MVC-aware
                        // matching, so OPTIONS is permitted even for unregistered paths.
                        .requestMatchers(new AntPathRequestMatcher("/**", HttpMethod.OPTIONS.name())).permitAll()
                        // Public auth endpoints
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // OAuth2 endpoints must be fully open
                        .requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll()
                        // Public GET trails/regions
                        .requestMatchers(HttpMethod.GET, "/api/v1/trails/**", "/api/v1/regions/**").permitAll()
                        // Everything else requires auth
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .authorizationEndpoint(auth -> auth
                                .authorizationRequestRepository(cookieAuthRequestRepository))
                        .userInfoEndpoint(u -> u.userService(oAuth2UserService))
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
