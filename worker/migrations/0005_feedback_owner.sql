ALTER TABLE feedback ADD COLUMN owner_hash TEXT;
CREATE INDEX feedback_owner_created ON feedback(owner_hash, created_at DESC, id DESC);
