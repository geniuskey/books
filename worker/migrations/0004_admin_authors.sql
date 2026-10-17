ALTER TABLE feedback ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1));
ALTER TABLE feedback_comments ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1));

-- The author confirmed ownership of this specific existing post.
UPDATE feedback SET is_admin = 1 WHERE id = '5a1a4058-362a-4398-b9ab-1485bb6500a8' AND nickname = 'Edwin';
