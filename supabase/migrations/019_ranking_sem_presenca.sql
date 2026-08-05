-- Ranking deixa de usar presença: peladas_jogadas = peladas com stats aprovadas

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
  COUNT(DISTINCT ps.pelada_id)::bigint AS peladas_jogadas
FROM team_members tm
JOIN profiles pr ON pr.id = tm.user_id
LEFT JOIN peladas pel ON pel.team_id = tm.team_id
LEFT JOIN player_stats ps
  ON ps.pelada_id = pel.id
  AND ps.user_id = tm.user_id
  AND ps.status = 'approved'
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
LEFT JOIN player_stats ps
  ON ps.fictional_player_id = fp.id
  AND ps.status = 'approved'
GROUP BY fp.team_id, fp.id, fp.display_name, fp.nickname;
