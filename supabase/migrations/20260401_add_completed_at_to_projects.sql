-- Add completed_at and delivered_at columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Backfill: projects currently 'completed' → completed_at = updated_at
UPDATE projects
SET completed_at = updated_at
WHERE status = 'completed'
  AND completed_at IS NULL;

-- Backfill: projects currently 'delivered' → delivered_at = updated_at
-- (completed_at left null unless we know they went through 'completed' first)
UPDATE projects
SET delivered_at = updated_at
WHERE status = 'delivered'
  AND delivered_at IS NULL;
