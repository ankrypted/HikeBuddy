-- ── Conversations ──────────────────────────────────────────────────────────
-- participant_a < participant_b enforces a single canonical row per pair.
CREATE TABLE conversation (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a   VARCHAR(50)   NOT NULL,
    participant_b   VARCHAR(50)   NOT NULL,
    last_message_at TIMESTAMPTZ   NOT NULL DEFAULT now(),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT uq_conversation_pair UNIQUE (participant_a, participant_b),
    CONSTRAINT chk_participant_order CHECK (participant_a < participant_b)
);

CREATE INDEX idx_conversation_a ON conversation(participant_a);
CREATE INDEX idx_conversation_b ON conversation(participant_b);

-- ── Messages ───────────────────────────────────────────────────────────────
CREATE TABLE message (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID          NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    sender_username VARCHAR(50)   NOT NULL,
    body            TEXT          NOT NULL,
    sent_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
    read_at         TIMESTAMPTZ
);

CREATE INDEX idx_message_convo_sent ON message(conversation_id, sent_at);
