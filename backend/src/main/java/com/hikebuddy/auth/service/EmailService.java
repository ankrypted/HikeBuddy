package com.hikebuddy.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${app.email.from}")
    private String fromAddress;

    @Value("${app.email.enabled:true}")
    private boolean emailEnabled;

    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;

        if (!emailEnabled) {
            log.info("[DEV] Email verification link for {}: {}", toEmail, link);
            return;
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(toEmail);
        message.setSubject("Verify your HikeBuddy email");
        message.setText(
                "Welcome to HikeBuddy!\n\n" +
                "Please verify your email address by clicking the link below:\n\n" +
                link + "\n\n" +
                "This link expires in 24 hours.\n\n" +
                "If you did not create a HikeBuddy account, you can safely ignore this email."
        );

        mailSender.send(message);
        log.debug("Verification email sent to {}", toEmail);
    }
}
