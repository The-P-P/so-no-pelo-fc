-- ============================================================
-- Backfill: peladas existentes voltam a contar no ranking
-- (antes do status, todas as approved já entravam)
-- ============================================================

UPDATE peladas
SET
  status = 'finished',
  finished_at = COALESCE(finished_at, updated_at, created_at),
  finished_by = COALESCE(finished_by, created_by)
WHERE status = 'open';
