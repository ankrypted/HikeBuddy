package com.hikebuddy.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/**
 * Tests ContentModerationService in isolation by intercepting every HTTP call
 * it makes to api.anthropic.com and returning a canned response instead.
 * No real API key or network connection required.
 */
class ContentModerationServiceTest {

    private MockRestServiceServer server;   // intercepts HTTP calls
    private ContentModerationService svc;

    @BeforeEach
    void setUp() {
        // RestTemplate is the underlying HTTP engine Spring uses.
        // MockRestServiceServer hooks into it and captures outgoing requests.
        RestTemplate restTemplate = new RestTemplate();
        server = MockRestServiceServer.bindTo(restTemplate).build();

        // Build a RestClient that routes through the same RestTemplate,
        // so MockRestServiceServer can intercept it.
        RestClient restClient = RestClient.builder(restTemplate)
                .baseUrl("https://api.anthropic.com")
                .build();

        // Use the package-private test constructor — no API key needed.
        svc = new ContentModerationService(true, new ObjectMapper(), restClient);
    }

    // ── Clean review ──────────────────────────────────────────────────────────

    @Test
    void moderate_cleanReview_returnsApproved() {
        // Tell the fake server: when anyone POSTs to /v1/messages, respond with this JSON.
        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess(claudeResponse(
                      "{\"approved\":true,\"category\":\"clean\",\"reason\":\"Genuine trail feedback\"}"
              ), MediaType.APPLICATION_JSON));

        ModerationResult result = svc.moderate("Beautiful trail, hard climb!", 5, "Hampta Pass");

        assertThat(result.approved()).isTrue();
        assertThat(result.category()).isEqualTo("clean");
        server.verify(); // confirms the HTTP call was actually made
    }

    // ── Spam ─────────────────────────────────────────────────────────────────

    @Test
    void moderate_spamContent_returnsRejected() {
        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess(claudeResponse(
                      "{\"approved\":false,\"category\":\"spam\",\"reason\":\"Promotional link detected\"}"
              ), MediaType.APPLICATION_JSON));

        ModerationResult result = svc.moderate("Buy cheap gear at traildeals.com!!!", 1, "Hampta Pass");

        assertThat(result.approved()).isFalse();
        assertThat(result.category()).isEqualTo("spam");
        assertThat(result.reason()).isEqualTo("Promotional link detected");
    }

    // ── Hate speech ───────────────────────────────────────────────────────────

    @Test
    void moderate_hateSpeech_returnsRejected() {
        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess(claudeResponse(
                      "{\"approved\":false,\"category\":\"hate_speech\",\"reason\":\"Discriminatory language\"}"
              ), MediaType.APPLICATION_JSON));

        ModerationResult result = svc.moderate("[hateful content]", 1, "Hampta Pass");

        assertThat(result.approved()).isFalse();
        assertThat(result.category()).isEqualTo("hate_speech");
    }

    // ── Model wraps JSON in markdown fences (defensive parsing) ───────────────

    @Test
    void moderate_modelAddsMarkdownFences_stillParses() {
        // Despite the system prompt saying "no markdown", models occasionally wrap
        // their output in ```json ... ```. The service should handle this gracefully.
        String withFences = "```json\n{\"approved\":true,\"category\":\"clean\",\"reason\":\"OK\"}\n```";

        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess(claudeResponse(withFences), MediaType.APPLICATION_JSON));

        ModerationResult result = svc.moderate("Great hike!", 4, "Hampta Pass");

        assertThat(result.approved()).isTrue();
    }

    // ── API returns 500 → fail-open ───────────────────────────────────────────

    @Test
    void moderate_apiReturns500_failsOpen() {
        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withStatus(HttpStatus.INTERNAL_SERVER_ERROR));

        // Service should NOT throw — it must fail open and let the review through.
        ModerationResult result = svc.moderate("Great trail!", 5, "Hampta Pass");

        assertThat(result.approved()).isTrue();
        assertThat(result.category()).isEqualTo("clean");
    }

    // ── API returns malformed JSON → fail-open ────────────────────────────────

    @Test
    void moderate_malformedJson_failsOpen() {
        server.expect(requestTo("https://api.anthropic.com/v1/messages"))
              .andExpect(method(HttpMethod.POST))
              .andRespond(withSuccess(claudeResponse("not json at all"), MediaType.APPLICATION_JSON));

        ModerationResult result = svc.moderate("Great trail!", 5, "Hampta Pass");

        assertThat(result.approved()).isTrue(); // fail-open
    }

    // ── Disabled → no HTTP call made at all ───────────────────────────────────

    @Test
    void moderate_serviceDisabled_skipsApiCall() {
        ContentModerationService disabled = new ContentModerationService(
                false, new ObjectMapper(), null  // restClient is null — would NPE if called
        );

        // Should return pass() immediately without touching the network.
        ModerationResult result = disabled.moderate("Anything", 3, "Some Trail");

        assertThat(result.approved()).isTrue();
        // server.verify() would confirm no requests were made, but since we used
        // a separate 'disabled' instance not wired to the server, the absence of
        // an exception is sufficient proof here.
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    /**
     * Wraps a Claude text response into the full Anthropic API response envelope.
     * This mirrors what api.anthropic.com actually returns.
     */
    private String claudeResponse(String text) {
        // Escape the text so it's valid inside a JSON string
        String escaped = text.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
        return """
                {
                  "id": "msg_test",
                  "type": "message",
                  "role": "assistant",
                  "content": [{"type": "text", "text": "%s"}],
                  "model": "claude-haiku-4-5-20251001",
                  "stop_reason": "end_turn",
                  "usage": {"input_tokens": 10, "output_tokens": 20}
                }
                """.formatted(escaped);
    }
}
