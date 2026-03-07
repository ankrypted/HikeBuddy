-- Feed likes: one row per (owner, event, liker) — unique constraint prevents duplicates
CREATE TABLE feed_likes (
    id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_username VARCHAR(50) NOT NULL,
    event_id       VARCHAR(100) NOT NULL,
    liker_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_feed_like UNIQUE (owner_username, event_id, liker_id)
);

CREATE INDEX idx_feed_likes_event ON feed_likes(owner_username, event_id);

-- Feed comments
CREATE TABLE feed_comments (
    id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_username VARCHAR(50) NOT NULL,
    event_id       VARCHAR(100) NOT NULL,
    author_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body           TEXT        NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feed_comments_event ON feed_comments(owner_username, event_id, created_at);

-- Notifications
CREATE TABLE notifications (
    id              UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_username  VARCHAR(50)  NOT NULL,
    actor_avatar_url TEXT,
    type            VARCHAR(20)  NOT NULL,
    owner_username  VARCHAR(50)  NOT NULL,
    event_id        VARCHAR(100) NOT NULL,
    message         VARCHAR(300) NOT NULL,
    read            BOOLEAN      NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, created_at DESC);
