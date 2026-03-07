CREATE TABLE user_subscriptions (
    follower_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followee_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (follower_id, followee_id),
    CHECK (follower_id <> followee_id)
);

CREATE INDEX idx_subscriptions_follower ON user_subscriptions(follower_id);
CREATE INDEX idx_subscriptions_followee ON user_subscriptions(followee_id);
