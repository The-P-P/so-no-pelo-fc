-- ============================================================
-- Só no Pelo FC — Schema completo com RLS
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE team_role AS ENUM ('owner', 'admin', 'player');
CREATE TYPE stat_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- PROFILES (espelha auth.users)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Trigger: cria profile ao registrar usuário (e-mail ou telefone)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, phone, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TEAMS
-- ============================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  player_invite_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  admin_invite_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_teams_player_invite ON teams(player_invite_token);
CREATE UNIQUE INDEX idx_teams_admin_invite ON teams(admin_invite_token);

CREATE INDEX idx_teams_slug ON teams(slug);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- ============================================================
-- TEAM MEMBERS (roles: owner, admin, player)
-- ============================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'player',
  nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================================
-- PESOS DE STATS (preparado para ranking ponderado)
-- ============================================================

CREATE TABLE team_stat_weights (
  team_id UUID PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  goals INT NOT NULL DEFAULT 3,
  assists INT NOT NULL DEFAULT 2,
  god_saves INT NOT NULL DEFAULT 2,
  vacilos INT NOT NULL DEFAULT -1,
  own_goals INT NOT NULL DEFAULT -2,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JOGADORES FICTÍCIOS (testes)
-- ============================================================

CREATE TABLE fictional_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  nickname TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(team_id, display_name)
);

CREATE INDEX idx_fictional_players_team ON fictional_players(team_id);

-- ============================================================
-- PELADAS (partidas)
-- ============================================================

CREATE TABLE peladas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opponent TEXT NOT NULL,
  score_home INT NOT NULL DEFAULT 0,
  score_away INT NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_peladas_team ON peladas(team_id);
CREATE INDEX idx_peladas_date ON peladas(date DESC);

-- ============================================================
-- PRESENÇA NAS PELADAS
-- ============================================================

CREATE TABLE pelada_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  present BOOLEAN NOT NULL DEFAULT true,
  marked_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pelada_id, user_id)
);

CREATE INDEX idx_pelada_attendance_pelada ON pelada_attendance(pelada_id);
CREATE INDEX idx_pelada_attendance_user ON pelada_attendance(user_id);

-- ============================================================
-- PLAYER STATS (lançamentos por pelada)
-- ============================================================

CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  fictional_player_id UUID REFERENCES fictional_players(id) ON DELETE CASCADE,
  goals INT NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists INT NOT NULL DEFAULT 0 CHECK (assists >= 0),
  god_saves INT NOT NULL DEFAULT 0 CHECK (god_saves >= 0),
  own_goals INT NOT NULL DEFAULT 0 CHECK (own_goals >= 0),
  vacilos INT NOT NULL DEFAULT 0 CHECK (vacilos >= 0),
  vacilo_description TEXT,
  observation TEXT,
  status stat_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT player_stats_participant_check CHECK (
    (user_id IS NOT NULL AND fictional_player_id IS NULL)
    OR (user_id IS NULL AND fictional_player_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX idx_player_stats_pelada_user
  ON player_stats(pelada_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_player_stats_pelada_fictional
  ON player_stats(pelada_id, fictional_player_id) WHERE fictional_player_id IS NOT NULL;

CREATE INDEX idx_player_stats_pelada ON player_stats(pelada_id);
CREATE INDEX idx_player_stats_user ON player_stats(user_id);
CREATE INDEX idx_player_stats_status ON player_stats(status);

-- ============================================================
-- HELPER FUNCTIONS (usadas nas policies RLS)
-- ============================================================

-- Retorna o role do usuário no time (ou NULL se não for membro)
CREATE OR REPLACE FUNCTION get_team_role(p_team_id UUID, p_user_id UUID)
RETURNS team_role AS $$
  SELECT role FROM team_members
  WHERE team_id = p_team_id AND user_id = p_user_id
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica se é owner ou admin
CREATE OR REPLACE FUNCTION is_team_admin(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id
      AND user_id = p_user_id
      AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Verifica se é membro do time
CREATE OR REPLACE FUNCTION is_team_member(p_team_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Retorna team_id de uma pelada
CREATE OR REPLACE FUNCTION get_pelada_team_id(p_pelada_id UUID)
RETURNS UUID AS $$
  SELECT team_id FROM peladas WHERE id = p_pelada_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- TRIGGER: ao criar time, adiciona criador como owner
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_team()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner');

  INSERT INTO team_stat_weights (team_id)
  VALUES (NEW.id);

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

CREATE TRIGGER on_team_created
  AFTER INSERT ON teams
  FOR EACH ROW EXECUTE FUNCTION handle_new_team();

-- ============================================================
-- TRIGGER: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER peladas_updated_at BEFORE UPDATE ON peladas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fictional_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_stat_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE peladas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pelada_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- ---------- PROFILES ----------
CREATE POLICY "Usuários podem ver perfis de membros do mesmo time"
  ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() AND tm2.user_id = profiles.id
    )
  );

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Usuário cria próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ---------- TEAMS ----------
CREATE POLICY "Membros podem ver seus times"
  ON teams FOR SELECT
  USING (is_team_member(id, auth.uid()));

CREATE POLICY "Autenticados podem buscar times para entrar"
  ON teams FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários autenticados podem criar times"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Owner/Admin podem atualizar time"
  ON teams FOR UPDATE
  USING (is_team_admin(id, auth.uid()))
  WITH CHECK (is_team_admin(id, auth.uid()));

CREATE POLICY "Apenas owner pode deletar time"
  ON teams FOR DELETE
  USING (get_team_role(id, auth.uid()) = 'owner');

-- ---------- TEAM MEMBERS ----------
CREATE POLICY "Membros podem ver membros do time"
  ON team_members FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Owner/Admin podem adicionar membros"
  ON team_members FOR INSERT
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Owner/Admin podem atualizar roles (exceto owner)"
  ON team_members FOR UPDATE
  USING (
    is_team_admin(team_id, auth.uid())
    AND role != 'owner'
  )
  WITH CHECK (
    is_team_admin(team_id, auth.uid())
    AND role != 'owner'
    -- Apenas owner pode promover para admin
    AND (
      role != 'admin'
      OR get_team_role(team_id, auth.uid()) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owner/Admin podem remover membros (exceto owner)"
  ON team_members FOR DELETE
  USING (
    is_team_admin(team_id, auth.uid())
    AND role != 'owner'
    AND user_id != auth.uid()
  );

-- Permite usuário entrar em time via convite (self-insert como player)
CREATE POLICY "Usuário pode se juntar como player"
  ON team_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'player'
  );

-- ---------- FICTIONAL PLAYERS ----------
CREATE POLICY "Membros veem jogadores fictícios do grupo"
  ON fictional_players FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Admin cria jogadores fictícios"
  ON fictional_players FOR INSERT
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admin remove jogadores fictícios"
  ON fictional_players FOR DELETE
  USING (is_team_admin(team_id, auth.uid()));

-- ---------- STAT WEIGHTS ----------
CREATE POLICY "Membros veem pesos de stats"
  ON team_stat_weights FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Admin edita pesos de stats"
  ON team_stat_weights FOR UPDATE
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));

-- ---------- PELADAS ----------
CREATE POLICY "Membros podem ver peladas do time"
  ON peladas FOR SELECT
  USING (is_team_member(team_id, auth.uid()));

CREATE POLICY "Owner/Admin podem criar peladas"
  ON peladas FOR INSERT
  WITH CHECK (
    is_team_admin(team_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Owner/Admin podem editar peladas"
  ON peladas FOR UPDATE
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));

CREATE POLICY "Owner/Admin podem deletar peladas"
  ON peladas FOR DELETE
  USING (is_team_admin(team_id, auth.uid()));

-- ---------- PELADA ATTENDANCE ----------
CREATE POLICY "Membros veem presenças do grupo"
  ON pelada_attendance FOR SELECT
  USING (is_team_member(get_pelada_team_id(pelada_id), auth.uid()));

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

-- ---------- PLAYER STATS ----------
CREATE POLICY "Membros veem stats aprovadas; dono vê as próprias"
  ON player_stats FOR SELECT
  USING (
    is_team_member(get_pelada_team_id(pelada_id), auth.uid())
    AND (
      status = 'approved'
      OR user_id = auth.uid()
      OR is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
    )
  );

CREATE POLICY "Jogadores lançam próprias stats"
  ON player_stats FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_team_member(get_pelada_team_id(pelada_id), auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Jogador edita própria stat pendente"
  ON player_stats FOR UPDATE
  USING (
    user_id = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    user_id = auth.uid() AND status = 'pending'
  );

CREATE POLICY "Admin aprova/edita stats"
  ON player_stats FOR UPDATE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()))
  WITH CHECK (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin deleta stats"
  ON player_stats FOR DELETE
  USING (is_team_admin(get_pelada_team_id(pelada_id), auth.uid()));

CREATE POLICY "Admin lança stats de membros"
  ON player_stats FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND fictional_player_id IS NULL
    AND is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
  );

CREATE POLICY "Admin lança stats de fictícios"
  ON player_stats FOR INSERT
  WITH CHECK (
    fictional_player_id IS NOT NULL
    AND is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
  );

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

-- ============================================================
-- VIEWS para rankings (somente stats aprovadas)
-- ============================================================

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
