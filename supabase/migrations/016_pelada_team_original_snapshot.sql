-- Snapshot da distribuição original para restaurar após ajustes manuais

ALTER TABLE pelada_team_drafts
ADD COLUMN IF NOT EXISTS original_assignments JSONB;
