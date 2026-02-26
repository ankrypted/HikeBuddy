-- ── Saved / favourited trails per user ────────────────────────────────────
CREATE TABLE user_saved_trails (
    user_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_id  VARCHAR(64)  NOT NULL,   -- trail slug; FK to trails table added later
    saved_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, trail_id)
);

CREATE INDEX idx_saved_trails_user ON user_saved_trails(user_id);
