package com.hikebuddy.auth.oauth2;

import com.hikebuddy.user.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Wraps the Google OidcUser and carries our persisted User entity
 * so the success handler never needs a second DB lookup.
 */
public class CustomOAuth2User implements OidcUser {

    private final User user;
    private final OidcUser delegate;

    public CustomOAuth2User(User user, OidcUser delegate) {
        this.user = user;
        this.delegate = delegate;
    }

    public User getUser() {
        return user;
    }

    @Override public Map<String, Object> getClaims()     { return delegate.getClaims(); }
    @Override public OidcUserInfo getUserInfo()           { return delegate.getUserInfo(); }
    @Override public OidcIdToken getIdToken()             { return delegate.getIdToken(); }
    @Override public Map<String, Object> getAttributes() { return delegate.getAttributes(); }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.name()))
                .collect(Collectors.toList());
    }

    /** Spring uses getName() as the principal name; use our UUID. */
    @Override
    public String getName() {
        return user.getId().toString();
    }
}
