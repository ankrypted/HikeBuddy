package com.hikebuddy.auth.oauth2;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.web.AuthorizationRequestRepository;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.stereotype.Component;

/**
 * Stores the OAuth2 authorization request in a short-lived HttpOnly cookie
 * instead of the HTTP session, so it works with stateless JWT auth.
 */
@Component
public class HttpCookieOAuth2AuthorizationRequestRepository
        implements AuthorizationRequestRepository<OAuth2AuthorizationRequest> {

    static final String COOKIE_NAME   = "oauth2_auth_request";
    static final int    COOKIE_EXPIRY = 180; // seconds — enough time for user to complete OAuth

    @Override
    public OAuth2AuthorizationRequest loadAuthorizationRequest(HttpServletRequest request) {
        return CookieUtils.getCookie(request, COOKIE_NAME)
                .map(cookie -> CookieUtils.deserialize(cookie, OAuth2AuthorizationRequest.class))
                .orElse(null);
    }

    @Override
    public void saveAuthorizationRequest(
            OAuth2AuthorizationRequest authorizationRequest,
            HttpServletRequest request,
            HttpServletResponse response) {
        if (authorizationRequest == null) {
            CookieUtils.deleteCookie(request, response, COOKIE_NAME);
            return;
        }
        CookieUtils.addCookie(response, COOKIE_NAME,
                CookieUtils.serialize(authorizationRequest), COOKIE_EXPIRY);
    }

    @Override
    public OAuth2AuthorizationRequest removeAuthorizationRequest(
            HttpServletRequest request,
            HttpServletResponse response) {
        OAuth2AuthorizationRequest request_ = loadAuthorizationRequest(request);
        CookieUtils.deleteCookie(request, response, COOKIE_NAME);
        return request_;
    }
}
