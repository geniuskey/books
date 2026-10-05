CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('error', 'request', 'cheer')),
  nickname TEXT NOT NULL DEFAULT '' CHECK (length(nickname) <= 40),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 3000),
  book_id TEXT NOT NULL DEFAULT '',
  page_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX feedback_created_at ON feedback(created_at);
