CREATE TABLE room_itineraries (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id          UUID         NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    uploader_username VARCHAR(64) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    s3_key           VARCHAR(512) NOT NULL,
    file_size        BIGINT       NOT NULL,
    content_type     VARCHAR(128) NOT NULL,
    uploaded_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_itineraries_room_id ON room_itineraries(room_id);
