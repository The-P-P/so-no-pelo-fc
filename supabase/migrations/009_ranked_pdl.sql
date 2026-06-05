-- Sistema de Liga / PDL por temporada (vitórias na pelada)

ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS ranked_top_tier_name TEXT NOT NULL DEFAULT 'FENDA';

CREATE TABLE ranked_seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_ranked_seasons_team ON ranked_seasons(team_id);
CREATE UNIQUE INDEX idx_ranked_seasons_active_team
  ON ranked_seasons(team_id) WHERE is_active = true;

CREATE TABLE pelada_victories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES ranked_seasons(id) ON DELETE CASCADE,
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pdl_points INT NOT NULL DEFAULT 25 CHECK (pdl_points > 0),
  marked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(season_id, pelada_id, user_id)
);

CREATE INDEX idx_pelada_victories_season ON pelada_victories(season_id);
CREATE INDEX idx_pelada_victories_pelada ON pelada_victories(pelada_id);
CREATE INDEX idx_pelada_victories_user ON pelada_victories(user_id);

-- Temporada inicial para grupos existentes
INSERT INTO ranked_seasons (team_id, name, is_active)
SELECT t.id, 'Temporada 1', true
FROM teams t
WHERE NOT EXISTS (
  SELECT 1 FROM ranked_seasons rs WHERE rs.team_id = t.id
);

CREATE OR REPLACE FUNCTION handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  INSERT INTO team_stat_weights (team_id)
  VALUES (NEW.id);

  INSERT INTO ranked_seasons (team_id, name, is_active)
  VALUES (NEW.id, 'Temporada 1', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE ranked_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelada_victories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem temporadas do grupo"
  ON ranked_seasons FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Admin cria temporadas"
  ON ranked_seasons FOR INSERT
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admin atualiza temporadas"
  ON ranked_seasons FOR UPDATE
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Membros veem vitórias do grupo"
  ON pelada_victories FOR SELECT
  USING (
    is_team_member(
      (SELECT team_id FROM ranked_seasons WHERE id = season_id),
      auth.uid()
    )
  );

CREATE POLICY "Admin marca vitórias"
  ON pelada_victories FOR INSERT
  WITH CHECK (
    is_team_admin(
      (SELECT team_id FROM ranked_seasons WHERE id = season_id),
      auth.uid()
    )
    AND marked_by = auth.uid()
  );

CREATE POLICY "Admin desfaz vitórias"
  ON pelada_victories FOR DELETE
  USING (
    is_team_admin(
      (SELECT team_id FROM ranked_seasons WHERE id = season_id),
      auth.uid()
    )
  );

CREATE POLICY "Dono atualiza nome do elo máximo"
  ON teams FOR UPDATE
  USING (
    get_team_role(id, auth.uid()) = 'owner'
  )
  WITH CHECK (
    get_team_role(id, auth.uid()) = 'owner'
    AND ranked_top_tier_name IS NOT NULL
    AND length(trim(ranked_top_tier_name)) >= 2
  );

DROP VIEW IF EXISTS ranking_pdl;

CREATE VIEW ranking_pdl AS
SELECT
  rs.team_id,
  rs.id AS season_id,
  tm.user_id,
  pr.full_name,
  pr.avatar_url,
  tm.nickname,
  COALESCE(SUM(pv.pdl_points), 0)::bigint AS total_pdl,
  COUNT(pv.id)::bigint AS victories
FROM ranked_seasons rs
JOIN team_members tm ON tm.team_id = rs.team_id
JOIN profiles pr ON pr.id = tm.user_id
LEFT JOIN pelada_victories pv
  ON pv.season_id = rs.id
  AND pv.user_id = tm.user_id
WHERE rs.is_active = true
GROUP BY rs.team_id, rs.id, tm.user_id, pr.full_name, pr.avatar_url, tm.nickname;
