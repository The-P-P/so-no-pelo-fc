-- Função confiável para sair do grupo (bypassa falhas silenciosas de RLS no DELETE)

CREATE OR REPLACE FUNCTION leave_team(p_team_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role team_role;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_role
  FROM team_members
  WHERE team_id = p_team_id AND user_id = auth.uid();

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Você não é membro deste grupo';
  END IF;

  IF v_role = 'owner' THEN
    RAISE EXCEPTION 'Owner precisa transferir ownership antes de sair do grupo';
  END IF;

  DELETE FROM team_members
  WHERE team_id = p_team_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION leave_team(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION leave_team(UUID) TO authenticated;

-- Garante policy de saída (caso migration 008 não tenha sido aplicada)
DROP POLICY IF EXISTS "Usuário pode sair do próprio time (exceto owner)" ON team_members;
CREATE POLICY "Usuário pode sair do próprio time (exceto owner)"
  ON team_members FOR DELETE
  USING (
    user_id = auth.uid()
    AND role != 'owner'
  );
