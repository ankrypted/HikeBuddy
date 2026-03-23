CREATE TABLE hike_posts (
    id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trail_name     VARCHAR(128) NOT NULL,
    trail_slug     VARCHAR(128) NOT NULL,
    experience     TEXT        NOT NULL,
    condition      VARCHAR(16) NOT NULL,
    recommendation VARCHAR(8)  NOT NULL,
    tip            TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hike_posts_user    ON hike_posts(user_id);
CREATE INDEX idx_hike_posts_created ON hike_posts(created_at DESC);
