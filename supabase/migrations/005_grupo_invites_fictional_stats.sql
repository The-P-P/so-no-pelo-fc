-- Grupo: convites por role, jogadores fictícios, god_saves e pesos de ranking

-- Tokens de convite separados (participante vs admin)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS player_invite_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS admin_invite_token UUID NOT NULL DEFAULT uuid_generate_v4();

CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_player_invite ON teams(player_invite_token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teams_admin_invite ON teams(admin_invite_token);

-- Pesos de stats por grupo (preparado para otimizar ranks depois)
CREATE TABLE IF NOT EXISTS team_stat_weights (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  goals INT NOT NULL DEFAULT 3,
  assists INT NOT NULL DEFAULT 2,
  god_saves INT NOT NULL DEFAULT 2,
  vacilos INT NOT NULL DEFAULT -1,
  own_goals INT NOT NULL DEFAULT -2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Jogadores fictícios para testes
CREATE TABLE IF NOT EXISTS fictional_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, display_name)
);

CREATE INDEX IF NOT EXISTS idx_fictional_players_team ON fictional_players(team_id);

-- God save + suporte a jogadores fictícios nas stats
ALTER TABLE player_stats
  ADD COLUMN IF NOT EXISTS god_saves INT NOT NULL DEFAULT 0 CHECK (god_saves >= 0),
  ADD COLUMN IF NOT EXISTS fictional_player_id UUID REFERENCES fictional_players(id) ON DELETE CASCADE;

ALTER TABLE player_stats ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE player_stats DROP CONSTRAINT IF EXISTS player_stats_pelada_id_user_id_key;

ALTER TABLE player_stats DROP CONSTRAINT IF EXISTS player_stats_participant_check;
ALTER TABLE player_stats ADD CONSTRAINT player_stats_participant_check
  CHECK (
    (user_id IS NOT NULL AND fictional_player_id IS NULL)
    OR (user_id IS NULL AND fictional_player_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_stats_pelada_user
  ON player_stats(pelada_id, user_id) WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_player_stats_pelada_fictional
  ON player_stats(pelada_id, fictional_player_id) WHERE fictional_player_id IS NOT NULL;

-- Trigger: cria pesos padrão ao criar grupo
CREATE OR REPLACE FUNCTION handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  INSERT INTO team_stat_weights (team_id)
  VALUES (NEW.id)
  ON CONFLICT (team_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Entrada via token de convite (participante ou admin)
CREATE OR REPLACE FUNCTION join_team_via_invite(p_token UUID, p_nickname TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_team_id UUID;
  v_role team_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT id INTO v_team_id FROM teams WHERE player_invite_token = p_token;
  IF v_team_id IS NOT NULL THEN
    v_role := 'player';
  ELSE
    SELECT id INTO v_team_id FROM teams WHERE admin_invite_token = p_token;
    IF v_team_id IS NOT NULL THEN
      v_role := 'admin';
    END IF;
  END IF;

  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  INSERT INTO team_members (team_id, user_id, role, nickname)
  VALUES (v_team_id, auth.uid(), v_role, p_nickname);

  RETURN v_team_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Você já faz parte deste grupo';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Busca grupo pelo token (para exibir nome na tela de entrada)
CREATE OR REPLACE FUNCTION get_team_by_invite_token(p_token UUID)
RETURNS TABLE (id UUID, name TEXT, invite_role team_role) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.name, 'player'::team_role
  FROM teams t WHERE t.player_invite_token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT t.id, t.name, 'admin'::team_role
    FROM teams t WHERE t.admin_invite_token = p_token
    LIMIT 1;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RLS: fictional_players
ALTER TABLE fictional_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem jogadores fictícios do grupo"
  ON fictional_players FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Admin cria jogadores fictícios"
  ON fictional_players FOR INSERT
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admin remove jogadores fictícios"
  ON fictional_players FOR DELETE
  USING (is_team_admin(team_id, auth.uid()));

-- RLS: team_stat_weights
ALTER TABLE team_stat_weights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membros veem pesos de stats"
  ON team_stat_weights FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Admin edita pesos de stats"
  ON team_stat_weights FOR UPDATE
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));

-- RLS: busca grupo por token de convite
CREATE POLICY "Autenticados buscam grupo por token de convite"
  ON teams FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      player_invite_token IS NOT NULL
      OR admin_invite_token IS NOT NULL
    )
  );

-- Admin lança stats para jogadores fictícios
CREATE POLICY "Admin lança stats de fictícios"
  ON player_stats FOR INSERT
  WITH CHECK (
    fictional_player_id IS NOT NULL
    AND is_team_admin(
      get_pelada_team_id(pelada_id),
      auth.uid()
    )
  );

-- Admin incrementa stats direto (aprovadas)
CREATE POLICY "Admin edita stats de fictícios"
  ON player_stats FOR UPDATE
  USING (
    fictional_player_id IS NOT NULL
    AND is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
  )
  WITH CHECK (
    fictional_player_id IS NOT NULL
    AND is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
  );

-- Views de ranking atualizadas (DROP necessário pois colunas mudaram de nome)
DROP VIEW IF EXISTS ranking_pelada;
DROP VIEW IF EXISTS ranking_geral;

CREATE VIEW ranking_geral AS
SELECT
  t.id AS team_id,
  COALESCE(p.user_id, fp.id) AS participant_id,
  CASE WHEN p.user_id IS NOT NULL THEN 'member' ELSE 'fictional' END AS participant_type,
  COALESCE(pr.full_name, fp.display_name) AS full_name,
  pr.avatar_url,
  COALESCE(tm.nickname, fp.nickname) AS nickname,
  COALESCE(SUM(p.goals), 0) AS total_goals,
  COALESCE(SUM(p.assists), 0) AS total_assists,
  COALESCE(SUM(p.god_saves), 0) AS total_god_saves,
  COALESCE(SUM(p.own_goals), 0) AS total_own_goals,
  COALESCE(SUM(p.vacilos), 0) AS total_vacilos,
  COUNT(DISTINCT pel.id) AS peladas_jogadas
FROM player_stats p
JOIN peladas pel ON pel.id = p.pelada_id
JOIN teams t ON t.id = pel.team_id
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = p.user_id
LEFT JOIN fictional_players fp ON fp.id = p.fictional_player_id
WHERE p.status = 'approved'
GROUP BY t.id, p.user_id, fp.id, fp.display_name, pr.full_name, pr.avatar_url, tm.nickname, fp.nickname;

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
