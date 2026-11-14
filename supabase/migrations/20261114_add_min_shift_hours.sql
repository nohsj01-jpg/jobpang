-- Add min_shift_hours column to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS min_shift_hours INTEGER NOT NULL DEFAULT 0;

-- Update RLS policy for stores (if needed) to allow owners to insert/update this column automatically
-- Assuming existing policy posts_manage_owner covers stores, ensure it includes column.
