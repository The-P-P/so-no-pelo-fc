-- Solicitações de alteração de nome/apelido com aprovação do admin

CREATE TYPE profile_change_type AS ENUM ('full_name', 'nickname');

CREATE TABLE profile_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_type profile_change_type NOT NULL,
  requested_value TEXT NOT NULL,
  status stat_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_profile_change_requests_one_pending
  ON profile_change_requests (team_id, user_id, change_type)
  WHERE status = 'pending';

CREATE INDEX idx_profile_change_requests_team_pending
  ON profile_change_requests (team_id)
  WHERE status = 'pending';

CREATE TRIGGER profile_change_requests_updated_at
  BEFORE UPDATE ON profile_change_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membro vê próprias solicitações de perfil"
  ON profile_change_requests FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_team_admin(team_id, auth.uid())
  );

CREATE POLICY "Membro solicita alteração de perfil"
  ON profile_change_requests FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND is_team_member(team_id, auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Membro edita solicitação pendente de perfil"
  ON profile_change_requests FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admin gerencia solicitações de perfil"
  ON profile_change_requests FOR UPDATE
  USING (is_team_admin(team_id, auth.uid()))
  WITH CHECK (is_team_admin(team_id, auth.uid()));
