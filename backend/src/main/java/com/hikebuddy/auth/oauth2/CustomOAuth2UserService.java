package com.hikebuddy.auth.oauth2;

import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(request);

        String googleId  = oAuth2User.getAttribute("sub");
        String email     = oAuth2User.getAttribute("email");
        String name      = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");

        userRepository.findByGoogleId(googleId).ifPresentOrElse(
                existing -> {
                    // Update avatar if changed
                    if (avatarUrl != null && !avatarUrl.equals(existing.getAvatarUrl())) {
                        existing.setAvatarUrl(avatarUrl);
                        userRepository.save(existing);
                    }
                },
                () -> {
                    // First-time Google login — create account
                    String username = deriveUsername(name, email);
                    User newUser = User.builder()
                            .username(username)
                            .email(email)
                            .googleId(googleId)
                            .avatarUrl(avatarUrl)
                            .provider(User.AuthProvider.GOOGLE)
                            .build();
                    userRepository.save(newUser);
                    log.info("New Google user created: {}", email);
                }
        );

        return oAuth2User;
    }

    /** Derive a unique username from the Google display name or email prefix. */
    private String deriveUsername(String displayName, String email) {
        String base = (displayName != null && !displayName.isBlank())
                ? displayName.replaceAll("\\s+", "").toLowerCase()
                : email.split("@")[0];

        // Ensure uniqueness by appending a short random suffix if taken
        String candidate = base.length() > 48 ? base.substring(0, 48) : base;
        if (!userRepository.existsByUsername(candidate)) return candidate;

        String suffixed = candidate + UUID.randomUUID().toString().substring(0, 6);
        return suffixed.length() > 50 ? suffixed.substring(0, 50) : suffixed;
    }
}
