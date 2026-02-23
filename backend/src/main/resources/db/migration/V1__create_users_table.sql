-- Users table
CREATE TABLE users (
    id            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    google_id     VARCHAR(255) UNIQUE,
    avatar_url    VARCHAR(500),
    provider      VARCHAR(10)  NOT NULL DEFAULT 'LOCAL',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Roles join table
CREATE TABLE user_roles (
    user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role    VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role)
);

-- Indexes for fast auth lookups
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
