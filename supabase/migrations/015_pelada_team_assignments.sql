-- Distribuição de times por pelada (balanceamento por stats)

CREATE TABLE IF NOT EXISTS pelada_team_drafts (
  pelada_id UUID PRIMARY KEY REFERENCES peladas(id) ON DELETE CASCADE,
  players_per_team INT NOT NULL DEFAULT 5 CHECK (players_per_team >= 2),
  skill_metric TEXT NOT NULL DEFAULT 'avg_score',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS pelada_team_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  team_index INT NOT NULL CHECK (team_index >= 0),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fictional_player_id UUID REFERENCES fictional_players(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT pelada_team_assignments_participant_check CHECK (
    (user_id IS NOT NULL AND fictional_player_id IS NULL)
    OR (user_id IS NULL AND fictional_player_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_pelada_team_assignments_pelada_user
  ON pelada_team_assignments(pelada_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX idx_pelada_team_assignments_pelada_fictional
  ON pelada_team_assignments(pelada_id, fictional_player_id)
  WHERE fictional_player_id IS NOT NULL;

CREATE INDEX idx_pelada_team_assignments_pelada
  ON pelada_team_assignments(pelada_id);

ALTER TABLE pelada_team_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelada_team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem draft de times da pelada"
  ON pelada_team_drafts FOR SELECT
  USING (is_team_member(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin gerencia draft de times da pelada"
  ON pelada_team_drafts FOR INSERT
  WITH CHECK (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin atualiza draft de times da pelada"
  ON pelada_team_drafts FOR UPDATE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()))
  WITH CHECK (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin remove draft de times da pelada"
  ON pelada_team_drafts FOR DELETE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Membros veem assignments de times da pelada"
  ON pelada_team_assignments FOR SELECT
  USING (is_team_member(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin insere assignments de times da pelada"
  ON pelada_team_assignments FOR INSERT
  WITH CHECK (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin atualiza assignments de times da pelada"
  ON pelada_team_assignments FOR UPDATE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()))
  WITH CHECK (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin remove assignments de times da pelada"
  ON pelada_team_assignments FOR DELETE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));
