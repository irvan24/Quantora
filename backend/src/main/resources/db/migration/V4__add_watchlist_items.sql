CREATE TABLE watchlist_items (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id),
    symbol     VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_watchlist_items_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX idx_watchlist_items_user_id ON watchlist_items (user_id);
