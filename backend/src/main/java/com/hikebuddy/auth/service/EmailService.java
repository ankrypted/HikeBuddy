package com.hikebuddy.auth.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.email.from}")
    private String fromAddress;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    @Value("${resend.api-key:}")
    private String resendApiKey;

    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;

        if (!emailEnabled) {
            log.info("[DEV] Email verification link for {}: {}", toEmail, link);
            return;
        }

        try {
            Resend resend = new Resend(resendApiKey);

            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("Verify your HikeBuddy email")
                    .html(
                        "<p>Welcome to HikeBuddy!</p>" +
                        "<p>Please verify your email address by clicking the link below:</p>" +
                        "<p><a href=\"" + link + "\">Verify Email</a></p>" +
                        "<p>This link expires in 24 hours.</p>" +
                        "<p>If you did not create a HikeBuddy account, you can safely ignore this email.</p>"
                    )
                    .build();

            resend.emails().send(params);
            log.debug("Verification email sent to {}", toEmail);

        } catch (ResendException e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send verification email", e);
        }
    }
}
