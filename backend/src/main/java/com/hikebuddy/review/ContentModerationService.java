package com.hikebuddy.review;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ContentModerationService {
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
                return true;
            }
        }

        return false;
    }
}