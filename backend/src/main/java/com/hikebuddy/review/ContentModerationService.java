package com.hikebuddy.review;

import org.springframework.stereotype.Service;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ContentModerationService {
    private static final Logger log = org.slf4j.LoggerFactory.getLogger(ContentModerationService.class);
    private static final List<String> BANNED_WORDS = List.of(
        "fuck",
        "shit",
        "bitch",
        "asshole",
        "bastard",
        "idiot",
        "moron",
        "stupid",
        "dumb",
        "trash",
        "garbage"
    );

    public boolean containsInappropriateContent(String text) {
        String lower = text.toLowerCase();

        String[] words = lower.split("\\W+");

        for (String word : words) {
            if (BANNED_WORDS.contains(word)) {
                log.info("{}=======> Found", word);

                return true;
            }
        }
        log.info("All good!");
        return false;
    }
}