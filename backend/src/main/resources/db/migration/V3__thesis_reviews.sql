CREATE TABLE thesis_reviews (
    id          BIGSERIAL PRIMARY KEY,
    thesis_id   BIGINT NOT NULL REFERENCES investment_theses (id) ON DELETE CASCADE,
    verdict     VARCHAR(32) NOT NULL,
    note        VARCHAR(2000),
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_thesis_reviews_thesis_id ON thesis_reviews (thesis_id);
