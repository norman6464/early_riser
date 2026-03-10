-- Comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    press_release_id INTEGER NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_press_release
        FOREIGN KEY (press_release_id)
        REFERENCES press_releases (id)
        ON DELETE CASCADE
);

-- Index for fetching comments by press release
CREATE INDEX idx_comments_press_release_id ON comments (press_release_id);
