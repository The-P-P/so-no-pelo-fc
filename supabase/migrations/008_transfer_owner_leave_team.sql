-- ============================================================
-- Transfer ownership + leave team
-- ============================================================

-- Owner transfere o grupo para outro membro
CREATE OR REPLACE FUNCTION transfer_team_ownership(
  p_team_id UUID,
  p_new_owner_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_current_owner UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT user_id INTO v_current_owner
  FROM team_members
  WHERE team_id = p_team_id AND role = 'owner'
  LIMIT 1;

  IF v_current_owner IS NULL THEN
    RAISE EXCEPTION 'Grupo sem dono';
  END IF;

  IF v_current_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Apenas o dono pode transferir ownership';
  END IF;

  IF p_new_owner_id = v_current_owner THEN
    RAISE EXCEPTION 'Novo dono deve ser diferente do atual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = p_new_owner_id
  ) THEN
    RAISE EXCEPTION 'Novo dono precisa ser membro do grupo';
  END IF;

  UPDATE team_members
  SET role = 'admin'
  WHERE team_id = p_team_id
    AND user_id = v_current_owner
    AND role = 'owner';

  UPDATE team_members
  SET role = 'owner'
  WHERE team_id = p_team_id
    AND user_id = p_new_owner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION transfer_team_ownership(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION transfer_team_ownership(UUID, UUID) TO authenticated;

-- Permite usuário sair do grupo (exceto owner)
DROP POLICY IF EXISTS "Usuário pode sair do próprio time (exceto owner)" ON team_members;
CREATE POLICY "Usuário pode sair do próprio time (exceto owner)"
  ON team_members FOR DELETE
  USING (
    user_id = auth.uid()
    AND role != 'owner'
  );
