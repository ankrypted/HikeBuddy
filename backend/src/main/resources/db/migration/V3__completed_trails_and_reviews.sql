CREATE TABLE user_completed_trails (
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_id     VARCHAR(64) NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, trail_id)
);
CREATE INDEX idx_completed_trails_user ON user_completed_trails(user_id);

CREATE TABLE trail_reviews (
    id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_id   VARCHAR(64) NOT NULL,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, trail_id)
);
CREATE INDEX idx_trail_reviews_trail ON trail_reviews(trail_id);
