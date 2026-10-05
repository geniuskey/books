ALTER TABLE feedback ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private'));
ALTER TABLE feedback ADD COLUMN read_at TEXT;
ALTER TABLE feedback ADD COLUMN is_hidden INTEGER NOT NULL DEFAULT 0 CHECK (is_hidden IN (0, 1));
CREATE INDEX feedback_public_created ON feedback(visibility, is_hidden, created_at DESC, id DESC);
