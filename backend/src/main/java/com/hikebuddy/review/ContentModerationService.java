package com.hikebuddy.review;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Rule-based content moderation for trail reviews.
 * No external API — runs in-process. Checks for profanity, spam,
 * hate speech, and personal information exposure.
 */
@Slf4j
@Service
public class ContentModerationService {

    private final boolean enabled;

    public ContentModerationService(
            @Value("${moderation.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    // ── Profanity ─────────────────────────────────────────────────────────────
    // Patterns cover common obfuscations: leet speak (4→a, 3→e, 1→i, 0→o),
    // symbol substitutions (@→a, $→s, !→i), and asterisk censoring (f**k).

    private static final List<Pattern> PROFANITY_PATTERNS = List.of(
        // fuck / f**k / f4ck / fvck / fu*k etc.
        compile("f[u*@4uú][c*ck][k]"),
        compile("fuck(?:ing|er|ed|s|face|wit|head|tard|wad|nut)?"),
        // shit / sh!t / sh1t / shyt
        compile("sh[i*1!y][t](?:ty|ter|ting|bag|head|hole|faced)?"),
        // bitch / b*tch / b1tch
        compile("b[i*1!][t][c][h](?:es|ing|y)?"),
        // asshole / a**hole / @sshole
        compile("[@a][s$][s$](?:[h][o0][l1][e]|[h]at)?"),
        compile("[@a][s$][s$](?:es|ing|hole)?"),
        // cunt
        compile("c[u*][n][t](?:s|ing)?"),
        // cock
        compile("\\bc[o0][c][k](?:s|sucker|head)?\\b"),
        // dick
        compile("\\bd[i1][c][k](?:s|head|face)?\\b"),
        // whore / wh0re
        compile("wh[o0][r][e](?:s|d|monger)?"),
        // slut
        compile("sl[u][t](?:s|ty)?"),
        // bastard
        compile("b[a@][s$][t][a@][r][d](?:s|ly)?"),
        // prick
        compile("pr[i1]ck(?:s|ly)?"),
        // twat
        compile("tw[a@][t](?:s)?"),
        // wank
        compile("w[a@]nk(?:er|ers|ing|s)?"),
        // Hate speech — slurs
        compile("n[i1*!][g$][g$][ae][r]?(?:s)?"),
        compile("f[a4@][g$]{1,2}(?:[o0][t]|s|gy|got)?"),
        compile("r[e3][t][a@][r][d](?:ed|s)?"),
        compile("\\bsp[i1]c(?:s)?\\b"),
        compile("\\bch[i1]nk(?:s)?\\b"),
        compile("\\bk[i1]k[e3](?:s)?\\b"),
        compile("\\btr[a4]nn[yi](?:es|s)?\\b")
    );

    // ── Spam ──────────────────────────────────────────────────────────────────

    private static final Pattern URL_PATTERN = compile(
        "https?://|www\\.|\\.(?:com|net|org|io)\\b");

    private static final Pattern PROMO_PATTERN = compile(
        "\\b(?:buy|cheap|discount|deal|sale|offer|promo|coupon|free\\s+shipping|"
        + "click\\s+here|order\\s+now|limited\\s+time|\\d+%\\s*off)\\b");

    // 5+ identical characters in a row: "aaaaaaa", "!!!!!!"
    private static final Pattern REPEATED_CHARS = Pattern.compile("(.)\\1{4,}");

    // Same word repeated 3+ times: "buy buy buy"
    private static final Pattern REPEATED_WORDS =
        Pattern.compile("\\b(\\w{3,})(?:\\W+\\1){2,}\\b", Pattern.CASE_INSENSITIVE);

    // ── Personal info ─────────────────────────────────────────────────────────

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}");

    // Phone: 7-15 digit sequences with common separators
    private static final Pattern PHONE_PATTERN =
        Pattern.compile("(?:\\+?\\d[\\s\\-.()]?){7,15}\\d");

    // ── Public API ────────────────────────────────────────────────────────────

    public ModerationResult moderate(String comment, int rating, String trailName) {
        if (!enabled) {
            return ModerationResult.pass();
        }

        String normalized = normalize(comment);

        // Personal info — checked first (privacy priority)
        if (EMAIL_PATTERN.matcher(comment).find()) {
            return reject("personal_info", "Review contains an email address");
        }
        if (PHONE_PATTERN.matcher(comment).find()) {
            return reject("personal_info", "Review contains a phone number");
        }

        // Profanity / hate speech
        for (Pattern p : PROFANITY_PATTERNS) {
            if (p.matcher(normalized).find()) {
                String category = isHateSpeechPattern(p) ? "hate_speech" : "profanity";
                log.debug("Moderation blocked — category={}, pattern={}", category, p.pattern());
                return reject(category, "Review contains inappropriate language");
            }
        }

        // Spam
        if (URL_PATTERN.matcher(comment).find()) {
            return reject("spam", "Review contains a URL or promotional link");
        }
        if (PROMO_PATTERN.matcher(normalized).find()) {
            return reject("spam", "Review contains promotional content");
        }
        if (REPEATED_CHARS.matcher(comment).find()) {
            return reject("spam", "Review contains excessive repeated characters");
        }
        if (REPEATED_WORDS.matcher(comment).find()) {
            return reject("spam", "Review contains repeated words");
        }

        log.debug("Moderation passed for comment (length={})", comment.length());
        return ModerationResult.pass();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Normalises leet-speak and common symbol substitutions so that
     * "f4ck", "sh!t", "@sshole" etc. are matched by the same patterns.
     */
    private static String normalize(String text) {
        return text
            .replace('4', 'a').replace('@', 'a')
            .replace('3', 'e')
            .replace('1', 'i').replace('!', 'i')
            .replace('0', 'o')
            .replace('5', 's').replace('$', 's')
            .replace('7', 't')
            .replace('+', 't')
            .toLowerCase();
    }

    /** The last N patterns in PROFANITY_PATTERNS are hate-speech slurs. */
    private static boolean isHateSpeechPattern(Pattern p) {
        int idx = PROFANITY_PATTERNS.indexOf(p);
        return idx >= PROFANITY_PATTERNS.size() - 7; // last 7 are slurs
    }

    private static ModerationResult reject(String category, String reason) {
        return new ModerationResult(false, category, reason);
    }

    private static Pattern compile(String regex) {
        return Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
    }
}
