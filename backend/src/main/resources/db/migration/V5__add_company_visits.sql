CREATE TABLE company_visits (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users (id),
    symbol           VARCHAR(20) NOT NULL,
    max_section_rank INTEGER NOT NULL DEFAULT 0,
    view_count       INTEGER NOT NULL DEFAULT 1,
    first_viewed_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    last_viewed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_company_visits_user_symbol UNIQUE (user_id, symbol)
);

CREATE INDEX idx_company_visits_user_id ON company_visits (user_id);
