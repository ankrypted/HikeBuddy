package com.hikebuddy.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${app.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /** Ping own /health every 14 minutes to prevent Render free tier from sleeping. */
    @Scheduled(fixedDelay = 14 * 60 * 1000)
    public void ping() {
        try {
            restTemplate.getForObject(baseUrl + "/health", String.class);
            log.debug("Keep-alive ping OK");
        } catch (Exception e) {
            log.warn("Keep-alive ping failed: {}", e.getMessage());
        }
    }
}
