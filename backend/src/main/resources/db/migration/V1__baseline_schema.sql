-- Baseline schema for Quantora (PostgreSQL). Applied in production via Flyway; dev may use Hibernate update.

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    first_name      VARCHAR(255),
    last_name       VARCHAR(255),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    role            VARCHAR(32)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP,
    deleted_at      TIMESTAMP,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    user_id     BIGINT      NOT NULL REFERENCES users (id),
    expires_at  TIMESTAMP   NOT NULL,
    revoked     BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE onboarding_profiles (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL UNIQUE REFERENCES users (id),
    goal                  VARCHAR(64),
    time_horizon          VARCHAR(64),
    emergency_fund        VARCHAR(64),
    high_interest_debt    VARCHAR(64),
    contribution_plan     VARCHAR(64),
    monthly_contribution  NUMERIC(12, 2),
    contribution_period   VARCHAR(32),
    risk_reaction         VARCHAR(64),
    experience            VARCHAR(64),
    approach              VARCHAR(64),
    allocation_etfs       INTEGER,
    allocation_stocks     INTEGER,
    allocation_bonds      INTEGER,
    allocation_cash       INTEGER,
    review_cadence        VARCHAR(32),
    completed             BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at          TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP
);

CREATE TABLE onboarding_knowledge (
    onboarding_id BIGINT NOT NULL REFERENCES onboarding_profiles (id) ON DELETE CASCADE,
    topic         VARCHAR(64) NOT NULL,
    PRIMARY KEY (onboarding_id, topic)
);

CREATE TABLE onboarding_rules (
    onboarding_id BIGINT NOT NULL REFERENCES onboarding_profiles (id) ON DELETE CASCADE,
    position      INTEGER NOT NULL,
    body          VARCHAR(280) NOT NULL,
    PRIMARY KEY (onboarding_id, position)
);

CREATE TABLE investment_theses (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL REFERENCES users (id),
    title         VARCHAR(120) NOT NULL,
    symbol        VARCHAR(20),
    thesis_body   VARCHAR(4000) NOT NULL,
    invalidation  VARCHAR(2000),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP
);

CREATE INDEX idx_investment_theses_user_id ON investment_theses (user_id);

CREATE TABLE journal_entries (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id),
    body       VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries (user_id);

CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    user_id     BIGINT NOT NULL REFERENCES users (id),
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens (user_id);
