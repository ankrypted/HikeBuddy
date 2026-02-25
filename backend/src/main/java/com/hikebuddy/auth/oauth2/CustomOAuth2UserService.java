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
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        log.info("loadUser() called — fetching Google profile");
        OAuth2User oAuth2User = super.loadUser(request);

        String googleId  = oAuth2User.getAttribute("sub");
        String email     = oAuth2User.getAttribute("email");
        String name      = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");

        log.info("Google profile received: sub={}, email={}", googleId, email);

        User user = findOrCreateUser(googleId, email, name, avatarUrl);
        log.info("findOrCreateUser completed: userId={}", user.getId());

        // Wrap user entity in the principal so the success handler needs no DB lookup
        return new CustomOAuth2User(user, oAuth2User.getAttributes());
    }

    private User findOrCreateUser(String googleId, String email, String name, String avatarUrl) {
        log.info("findOrCreateUser: googleId={}, email={}", googleId, email);

        // Case 1: Returning Google user — update avatar if changed
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            log.info("Case 1: existing Google user found");
            User existing = byGoogleId.get();
            if (avatarUrl != null && !avatarUrl.equals(existing.getAvatarUrl())) {
                existing.setAvatarUrl(avatarUrl);
                userRepository.saveAndFlush(existing);
            }
            return existing;
        }

        // Case 2: Same email registered locally — link Google account to it
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            log.info("Case 2: linking Google to existing local user: {}", email);
            User existingLocal = byEmail.get();
            existingLocal.setGoogleId(googleId);
            if (avatarUrl != null) existingLocal.setAvatarUrl(avatarUrl);
            userRepository.saveAndFlush(existingLocal);
            return existingLocal;
        }

        // Case 3: Brand-new user via Google
        log.info("Case 3: creating new Google user: {}", email);
        String username = deriveUsername(name, email);
        User newUser = User.builder()
                .username(username)
                .email(email)
                .googleId(googleId)
                .avatarUrl(avatarUrl)
                .provider(User.AuthProvider.GOOGLE)
                .build();
        userRepository.saveAndFlush(newUser);
        log.info("New Google user saved with id={}", newUser.getId());
        return newUser;
    }

    /** Derive a unique username from the Google display name or email prefix. */
    private String deriveUsername(String displayName, String email) {
        String base = (displayName != null && !displayName.isBlank())
                ? displayName.replaceAll("\\s+", "").toLowerCase()
                : email.split("@")[0];

        String candidate = base.length() > 48 ? base.substring(0, 48) : base;
        if (!userRepository.existsByUsername(candidate)) return candidate;

        String suffixed = candidate + UUID.randomUUID().toString().substring(0, 6);
        return suffixed.length() > 50 ? suffixed.substring(0, 50) : suffixed;
    }
}
