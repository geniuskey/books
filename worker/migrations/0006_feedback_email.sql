-- Optional reply address. Only authenticated admin queries select this column.
ALTER TABLE feedback ADD COLUMN email TEXT NOT NULL DEFAULT '';
