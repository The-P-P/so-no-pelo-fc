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
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
-- PLAYER STATS (lançamentos por pelada)
-- ============================================================

CREATE TABLE player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pelada_id UUID NOT NULL REFERENCES peladas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  goals INT NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists INT NOT NULL DEFAULT 0 CHECK (assists >= 0),
  own_goals INT NOT NULL DEFAULT 0 CHECK (own_goals >= 0),
  vacilos INT NOT NULL DEFAULT 0 CHECK (vacilos >= 0),
  vacilo_description TEXT,
  observation TEXT,
  status stat_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pelada_id, user_id)
);

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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
ALTER TABLE peladas ENABLE ROW LEVEL SECURITY;
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

-- ============================================================
-- VIEWS para rankings (somente stats aprovadas)
-- ============================================================

CREATE OR REPLACE VIEW ranking_geral AS
SELECT
  t.id AS team_id,
  p.user_id,
  pr.full_name,
  pr.avatar_url,
  tm.nickname,
  COALESCE(SUM(p.goals), 0) AS total_goals,
  COALESCE(SUM(p.assists), 0) AS total_assists,
  COALESCE(SUM(p.own_goals), 0) AS total_own_goals,
  COALESCE(SUM(p.vacilos), 0) AS total_vacilos,
  COUNT(DISTINCT pel.id) AS peladas_jogadas
FROM player_stats p
JOIN peladas pel ON pel.id = p.pelada_id
JOIN teams t ON t.id = pel.team_id
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.user_id = p.user_id
WHERE p.status = 'approved'
GROUP BY t.id, p.user_id, pr.full_name, pr.avatar_url, tm.nickname;

CREATE OR REPLACE VIEW ranking_pelada AS
SELECT
  p.pelada_id,
  pel.team_id,
  p.user_id,
  pr.full_name,
  pr.avatar_url,
  tm.nickname,
  p.goals,
  p.assists,
  p.own_goals,
  p.vacilos,
  p.vacilo_description,
  p.observation
FROM player_stats p
JOIN peladas pel ON pel.id = p.pelada_id
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN team_members tm ON tm.team_id = pel.team_id AND tm.user_id = p.user_id
WHERE p.status = 'approved';
