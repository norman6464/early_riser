-- チャットメッセージ履歴テーブル
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    press_release_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_messages_press_release
        FOREIGN KEY (press_release_id)
        REFERENCES press_releases (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_press_release_id ON chat_messages (press_release_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages (press_release_id, created_at);
