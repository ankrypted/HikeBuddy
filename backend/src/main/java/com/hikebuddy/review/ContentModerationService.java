package com.hikebuddy.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Uses Claude (Haiku) to semantically moderate trail review content.
 * Fail-open by design — if the API is unreachable or returns an unexpected
 * response the review is allowed through and the error is logged.
 */
@Slf4j
@Service
public class ContentModerationService {

    private static final String MODEL = "claude-haiku-4-5-20251001";

    private static final String SYSTEM_PROMPT = """
            You are a content moderation system for a hiking trail review platform.
            Analyse the review and respond with ONLY valid JSON — no markdown, no extra text.
            """;

    private static final String USER_PROMPT_TEMPLATE = """
            Moderate this hiking trail review.
            Respond ONLY with JSON in this exact format:
            {"approved": true, "category": "clean", "reason": "brief explanation"}

            Categories (pick one):
              clean        – genuine, on-topic trail feedback (approve)
              profanity    – obscene or vulgar language (reject)
              hate_speech  – discriminatory or hateful content (reject)
              spam         – promotional links, repeated text, or gibberish (reject)
              harassment   – personal attacks on other users or trail staff (reject)
              off_topic    – entirely unrelated to hiking or the trail (reject)
              personal_info – exposes real names, phone numbers, emails, etc. (reject)

            Approve honest criticism — even very negative reviews are fine if they are genuine.

            Trail:  %s
            Rating: %d / 5
            Review: "%s"
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final boolean enabled;

    public ContentModerationService(
            @Value("${anthropic.api-key:}") String apiKey,
            @Value("${anthropic.moderation.enabled:true}") boolean enabled,
            ObjectMapper objectMapper) {

        this.objectMapper = objectMapper;
        boolean hasKey = apiKey != null && !apiKey.isBlank();
        this.enabled = enabled && hasKey;

        if (enabled && !hasKey) {
            log.warn("Content moderation is enabled but ANTHROPIC_API_KEY is not configured — moderation will be skipped");
        }

        this.restClient = hasKey
                ? RestClient.builder()
                        .baseUrl("https://api.anthropic.com")
                        .defaultHeader("x-api-key", apiKey)
                        .defaultHeader("anthropic-version", "2023-06-01")
                        .build()
                : null;
    }

    /** Package-private — used by tests to inject a RestClient backed by MockRestServiceServer. */
    ContentModerationService(boolean enabled, ObjectMapper objectMapper, RestClient restClient) {
        this.enabled = enabled;
        this.objectMapper = objectMapper;
        this.restClient = restClient;
    }

    /**
     * Moderates a review comment. Always returns a result — never throws.
     * On API failure the review is approved (fail-open).
     */
    public ModerationResult moderate(String comment, int rating, String trailName) {
        if (!enabled) {
            return ModerationResult.pass();
        }
        try {
            Map<String, Object> body = buildRequestBody(comment, rating, trailName);
            String responseText = callApi(body);
            return parseResult(responseText);
        } catch (Exception e) {
            log.warn("Content moderation API call failed (fail-open): {}", e.getMessage());
            return ModerationResult.pass();
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Map<String, Object> buildRequestBody(String comment, int rating, String trailName) {
        String trail = trailName != null && !trailName.isBlank() ? trailName : "Unknown Trail";
        String userPrompt = USER_PROMPT_TEMPLATE.formatted(trail, rating, comment);

        return Map.of(
                "model", MODEL,
                "max_tokens", 256,
                "system", SYSTEM_PROMPT,
                "messages", List.of(Map.of("role", "user", "content", userPrompt))
        );
    }

    @SuppressWarnings("unchecked")
    private String callApi(Map<String, Object> body) {
        Map<String, Object> response = restClient.post()
                .uri("/v1/messages")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(Map.class);

        if (response == null) {
            throw new IllegalStateException("Empty response from Anthropic API");
        }

        List<Map<String, Object>> content = (List<Map<String, Object>>) response.get("content");
        if (content == null || content.isEmpty()) {
            throw new IllegalStateException("No content in Anthropic API response");
        }

        Object text = content.get(0).get("text");
        if (text == null) {
            throw new IllegalStateException("No text in Anthropic API response content block");
        }
        return text.toString();
    }

    @SuppressWarnings("unchecked")
    private ModerationResult parseResult(String json) throws Exception {
        // Strip markdown code fences if the model added them despite instructions
        String clean = json.strip();
        if (clean.startsWith("```")) {
            clean = clean.replaceAll("(?s)^```[a-z]*\\s*", "").replaceAll("```\\s*$", "").strip();
        }

        Map<String, Object> parsed = objectMapper.readValue(clean, Map.class);
        boolean approved = Boolean.TRUE.equals(parsed.get("approved"));
        String category  = String.valueOf(parsed.getOrDefault("category", "unknown"));
        String reason    = String.valueOf(parsed.getOrDefault("reason", ""));

        log.debug("Moderation result — approved={}, category={}, reason={}", approved, category, reason);
        return new ModerationResult(approved, category, reason);
    }
}
