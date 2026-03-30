-- ── V11: Rooms ────────────────────────────────────────────────────────────────

CREATE TABLE rooms (
    id           UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_id     VARCHAR(128) NOT NULL,
    trail_name   VARCHAR(128) NOT NULL,
    planned_date DATE         NOT NULL,
    title        VARCHAR(200) NOT NULL,
    status       VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
    feed_post_id UUID,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_rooms_trail   ON rooms(trail_id);
CREATE INDEX idx_rooms_creator ON rooms(creator_id);
CREATE INDEX idx_rooms_planned ON rooms(planned_date);

-- Room membership (creator is auto-joined on creation)
CREATE TABLE room_members (
    room_id   UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

CREATE INDEX idx_room_members_user ON room_members(user_id);

-- Group chat messages
CREATE TABLE room_messages (
    id                UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id           UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_username   VARCHAR(50) NOT NULL,
    sender_avatar_url TEXT,
    content           TEXT        NOT NULL,
    sent_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_messages_room ON room_messages(room_id, sent_at);

-- Important updates (visible on trail page)
CREATE TABLE room_updates (
    id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id          UUID        NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    author_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_username  VARCHAR(50) NOT NULL,
    content          TEXT        NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_updates_room ON room_updates(room_id, created_at DESC);

-- Extend hike_posts for room-creation feed posts
ALTER TABLE hike_posts ADD COLUMN post_type VARCHAR(20) NOT NULL DEFAULT 'HIKE';
ALTER TABLE hike_posts ADD COLUMN room_id   UUID REFERENCES rooms(id) ON DELETE SET NULL;
