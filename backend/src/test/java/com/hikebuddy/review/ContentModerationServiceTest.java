package com.hikebuddy.review;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Tests the rule-based ContentModerationService in isolation.
 * No external API calls — all logic runs in-process.
 */
class ContentModerationServiceTest {

    private final ContentModerationService svc = new ContentModerationService(true);

    // ── Clean reviews ─────────────────────────────────────────────────────────

    @Test
    void moderate_cleanReview_approved() {
        assertApproved(svc.moderate("Beautiful trail, tough but worth it!", 5, "Hampta Pass"));
    }

    @Test
    void moderate_harshButCleanCriticism_approved() {
        // Very negative but no profanity — should pass
        assertApproved(svc.moderate("Terrible experience, trail was dangerous and poorly marked.", 1, "Hampta Pass"));
    }

    // ── Profanity ─────────────────────────────────────────────────────────────

    @Test
    void moderate_plainProfanity_rejected() {
        assertRejected(svc.moderate("absolute fucking piece of shit!", 1, "Rupin Pass"), "profanity");
    }

    @Test
    void moderate_leetSpeakProfanity_rejected() {
        // "f4ck" after leet normalisation → "fuck"
        assertRejected(svc.moderate("This trail f4cking sucked", 1, "Rupin Pass"), "profanity");
    }

    @Test
    void moderate_symbolCensoredProfanity_rejected() {
        // "sh!t" after leet normalisation → "shit"
        assertRejected(svc.moderate("What a sh!t experience", 1, "Rupin Pass"), "profanity");
    }

    // ── Spam ──────────────────────────────────────────────────────────────────

    @Test
    void moderate_urlInReview_rejected() {
        assertRejected(svc.moderate("Great trail! Buy gear at traildeals.com for 50% off", 5, "Hampta Pass"), "spam");
    }

    @Test
    void moderate_httpUrl_rejected() {
        assertRejected(svc.moderate("Visit https://spam.io for deals", 3, "Hampta Pass"), "spam");
    }

    @Test
    void moderate_repeatedCharacters_rejected() {
        assertRejected(svc.moderate("Amazinggggggg trail!!!!!!!", 5, "Hampta Pass"), "spam");
    }

    @Test
    void moderate_repeatedWords_rejected() {
        assertRejected(svc.moderate("buy buy buy gear here gear here gear here", 1, "Hampta Pass"), "spam");
    }

    // ── Personal info ─────────────────────────────────────────────────────────

    @Test
    void moderate_emailAddress_rejected() {
        assertRejected(svc.moderate("Contact me at hiker@gmail.com for trip info", 4, "Hampta Pass"), "personal_info");
    }

    @Test
    void moderate_phoneNumber_rejected() {
        assertRejected(svc.moderate("Call me on +91 98765 43210 to join our group", 4, "Hampta Pass"), "personal_info");
    }

    // ── Disabled ──────────────────────────────────────────────────────────────

    @Test
    void moderate_serviceDisabled_alwaysApproves() {
        ContentModerationService disabled = new ContentModerationService(false);
        assertApproved(disabled.moderate("absolute fucking piece of shit!", 1, "Any Trail"));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void assertApproved(ModerationResult r) {
        assertThat(r.approved()).as("expected approved but got: %s — %s", r.category(), r.reason()).isTrue();
    }

    private void assertRejected(ModerationResult r, String expectedCategory) {
        assertThat(r.approved()).as("expected rejected but was approved").isFalse();
        assertThat(r.category()).isEqualTo(expectedCategory);
    }
}
