/**
 * Client-side content moderation — first line of defence before a post is saved.
 * Catches obvious slurs, spam triggers, and contact-harvesting patterns.
 * Server-side moderation should be added when the backend posts API is built.
 */

const BLOCKED_PATTERNS: RegExp[] = [
  // Common profanity (partial-word matching intentional)
  /\bf+u+c+k+\b/i,
  /\bs+h+i+t+\b/i,
  /\ba+s+s+h+o+l+e/i,
  /\bb+i+t+c+h\b/i,
  /\bc+u+n+t\b/i,
  /\bd+i+c+k\b/i,
  /\bw+h+o+r+e\b/i,
  /\bn+i+g+g/i,
  /\bf+a+g+g/i,
  /\br+e+t+a+r+d/i,
  // Hate / threat language
  /\bkill\s+you(rself)?\b/i,
  /\bdie\s+bitch\b/i,
  /\bi\s+will\s+(kill|hurt|rape)\b/i,
  // Spam / contact harvesting
  /\bwhatsapp\b.*\d{7,}/i,
  /\btelegram\b.*@/i,
  /\bcall\s+me\b.*\d{7,}/i,
  /\b\d{10,}\b/,                        // raw phone numbers
  // URL spam (allow trail URLs but block naked links in posts)
  /https?:\/\/(?!hikebuddy\.in)[^\s]{20,}/i,
];

export interface ModerationResult {
  clean:   boolean;
  reason?: string;
}

export function moderateContent(...texts: string[]): ModerationResult {
  const combined = texts.join(' ');

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(combined)) {
      return {
        clean:  false,
        reason: 'Your post contains content that isn\'t allowed. Please keep it helpful and respectful.',
      };
    }
  }

  // Excessive caps check (> 70% uppercase letters = likely shouting/spam)
  const letters = combined.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 20) {
    const upperRatio = (combined.match(/[A-Z]/g)?.length ?? 0) / letters.length;
    if (upperRatio > 0.7) {
      return {
        clean:  false,
        reason: 'Please avoid writing in all caps.',
      };
    }
  }

  return { clean: true };
}
