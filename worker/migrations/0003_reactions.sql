CREATE TABLE feedback_comments (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '' CHECK (length(nickname) <= 40),
  message TEXT NOT NULL CHECK (length(message) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX feedback_comments_thread ON feedback_comments(feedback_id, created_at, id);
CREATE TABLE feedback_likes (
  feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  PRIMARY KEY (feedback_id, visitor_id)
);
