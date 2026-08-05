-- ============================================================
-- Status de finalização das peladas
-- Ranking só conta stats aprovadas de peladas finalizadas
-- Idempotente: seguro reexecutar se parcial
-- ============================================================

DO $$ BEGIN
  CREATE TYPE pelada_status AS ENUM ('open', 'finished');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE peladas
  ADD COLUMN IF NOT EXISTS status pelada_status NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS finished_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finished_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_peladas_team_status ON peladas(team_id, status);

-- Ranking geral: somente stats aprovadas de peladas finalizadas
DROP VIEW IF EXISTS ranking_pelada;
DROP VIEW IF EXISTS ranking_geral;

CREATE VIEW ranking_geral AS
SELECT
  tm.team_id,
  tm.user_id AS participant_id,
  'member'::text AS participant_type,
  pr.full_name,
  pr.avatar_url,
  tm.nickname,
  COALESCE(SUM(ps.goals), 0)::bigint AS total_goals,
  COALESCE(SUM(ps.assists), 0)::bigint AS total_assists,
  COALESCE(SUM(ps.god_saves), 0)::bigint AS total_god_saves,
  COALESCE(SUM(ps.own_goals), 0)::bigint AS total_own_goals,
  COALESCE(SUM(ps.vacilos), 0)::bigint AS total_vacilos,
  COUNT(DISTINCT CASE WHEN pa.present THEN pa.pelada_id END)::bigint AS peladas_jogadas
FROM team_members tm
JOIN profiles pr ON pr.id = tm.user_id
LEFT JOIN peladas pel ON pel.team_id = tm.team_id AND pel.status = 'finished'
LEFT JOIN player_stats ps
  ON ps.pelada_id = pel.id
  AND ps.user_id = tm.user_id
  AND ps.status = 'approved'
LEFT JOIN pelada_attendance pa
  ON pa.pelada_id = pel.id
  AND pa.user_id = tm.user_id
GROUP BY tm.team_id, tm.user_id, pr.full_name, pr.avatar_url, tm.nickname

UNION ALL

SELECT
  fp.team_id,
  fp.id AS participant_id,
  'fictional'::text AS participant_type,
  fp.display_name AS full_name,
  NULL::text AS avatar_url,
  fp.nickname,
  COALESCE(SUM(ps.goals), 0)::bigint AS total_goals,
  COALESCE(SUM(ps.assists), 0)::bigint AS total_assists,
  COALESCE(SUM(ps.god_saves), 0)::bigint AS total_god_saves,
  COALESCE(SUM(ps.own_goals), 0)::bigint AS total_own_goals,
  COALESCE(SUM(ps.vacilos), 0)::bigint AS total_vacilos,
  COUNT(DISTINCT ps.pelada_id)::bigint AS peladas_jogadas
FROM fictional_players fp
LEFT JOIN peladas pel ON pel.team_id = fp.team_id AND pel.status = 'finished'
LEFT JOIN player_stats ps
  ON ps.pelada_id = pel.id
  AND ps.fictional_player_id = fp.id
  AND ps.status = 'approved'
GROUP BY fp.team_id, fp.id, fp.display_name, fp.nickname;

CREATE VIEW ranking_pelada AS
SELECT
  p.pelada_id,
  pel.team_id,
  COALESCE(p.user_id, fp.id) AS participant_id,
  CASE WHEN p.user_id IS NOT NULL THEN 'member' ELSE 'fictional' END AS participant_type,
  COALESCE(pr.full_name, fp.display_name) AS full_name,
  pr.avatar_url,
  COALESCE(tm.nickname, fp.nickname) AS nickname,
  p.goals,
  p.assists,
  p.god_saves,
  p.own_goals,
  p.vacilos,
  p.vacilo_description,
  p.observation
FROM player_stats p
JOIN peladas pel ON pel.id = p.pelada_id
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN team_members tm ON tm.team_id = pel.team_id AND tm.user_id = p.user_id
LEFT JOIN fictional_players fp ON fp.id = p.fictional_player_id
WHERE p.status = 'approved'
  AND pel.status = 'finished';
