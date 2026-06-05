-- Presença nas peladas + ranking atualizado

CREATE TABLE IF NOT EXISTS pelada_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  marked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pelada_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pelada_attendance_pelada ON pelada_attendance(pelada_id);
CREATE INDEX IF NOT EXISTS idx_pelada_attendance_user ON pelada_attendance(user_id);

ALTER TABLE pelada_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem presenças do grupo"
  ON pelada_attendance FOR SELECT
  USING (
    is_team_member(get_pelada_team_id(pelada_id), auth.uid())
  );

CREATE POLICY "Jogador marca própria presença"
  ON pelada_attendance FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND marked_by = auth.uid()
    AND is_team_member(get_pelada_team_id(pelada_id), auth.uid())
  );

CREATE POLICY "Jogador atualiza própria presença"
  ON pelada_attendance FOR UPDATE
  USING (
    user_id = auth.uid()
    AND is_team_member(get_pelada_team_id(pelada_id), auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND marked_by = auth.uid()
  );

CREATE POLICY "Admin marca presença de qualquer membro"
  ON pelada_attendance FOR INSERT
  WITH CHECK (
    is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
    AND marked_by = auth.uid()
  );

CREATE POLICY "Admin atualiza presença de qualquer membro"
  ON pelada_attendance FOR UPDATE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()))
  WITH CHECK (
    is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
    AND marked_by = auth.uid()
  );

CREATE POLICY "Admin remove presença"
  ON pelada_attendance FOR DELETE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

-- Ranking geral: todos os membros + fictícios com stats
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
LEFT JOIN peladas pel ON pel.team_id = tm.team_id
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
LEFT JOIN player_stats ps
  ON ps.fictional_player_id = fp.id
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
WHERE p.status = 'approved';
