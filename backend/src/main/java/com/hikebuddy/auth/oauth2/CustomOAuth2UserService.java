package com.hikebuddy.auth.oauth2;

import com.hikebuddy.storage.S3Service;
import com.hikebuddy.user.User;
import com.hikebuddy.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends OidcUserService {

    private final UserRepository userRepository;
    private final S3Service s3Service;

    @Override
    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        log.info("loadUser() called — fetching Google profile");
        OidcUser oidcUser = super.loadUser(request);

        String googleId  = oidcUser.getAttribute("sub");
        String email     = oidcUser.getAttribute("email");
        String name      = oidcUser.getAttribute("name");
        String avatarUrl = oidcUser.getAttribute("picture");

        log.info("Google profile received: sub={}, email={}", googleId, email);

        User user = findOrCreateUser(googleId, email, name, avatarUrl);
        log.info("findOrCreateUser completed: userId={}", user.getId());

        return new CustomOAuth2User(user, oidcUser);
    }

    private User findOrCreateUser(String googleId, String email, String name, String avatarUrl) {
        log.info("findOrCreateUser: googleId={}, email={}", googleId, email);

        // Case 1: Returning Google user — re-mirror avatar if it's still a Google URL
        Optional<User> byGoogleId = userRepository.findByGoogleId(googleId);
        if (byGoogleId.isPresent()) {
            log.info("Case 1: existing Google user found");
            User existing = byGoogleId.get();
            if (avatarUrl != null && !s3Service.isOwnedUrl(existing.getAvatarUrl())) {
                String s3Url = s3Service.uploadAvatarFromUrl(avatarUrl, existing.getId().toString());
                existing.setAvatarUrl(s3Url != null ? s3Url : avatarUrl);
                userRepository.saveAndFlush(existing);
            }
            return existing;
        }

        // Case 2: Same email registered locally — link Google account and mirror avatar
        Optional<User> byEmail = userRepository.findByEmail(email);
        if (byEmail.isPresent()) {
            log.info("Case 2: linking Google to existing local user: {}", email);
            User existingLocal = byEmail.get();
            existingLocal.setGoogleId(googleId);
            if (avatarUrl != null) {
                String s3Url = s3Service.uploadAvatarFromUrl(avatarUrl, existingLocal.getId().toString());
                existingLocal.setAvatarUrl(s3Url != null ? s3Url : avatarUrl);
            }
            userRepository.saveAndFlush(existingLocal);
            return existingLocal;
        }

        // Case 3: Brand-new user via Google — save first to get ID, then mirror avatar
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
        if (avatarUrl != null) {
            String s3Url = s3Service.uploadAvatarFromUrl(avatarUrl, newUser.getId().toString());
            if (s3Url != null) {
                newUser.setAvatarUrl(s3Url);
                userRepository.saveAndFlush(newUser);
            }
        }
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
