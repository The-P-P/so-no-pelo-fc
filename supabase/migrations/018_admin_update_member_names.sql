-- Permite que owner/admin atualizem nome real e apelido de membros do grupo.
-- profiles só permite UPDATE do próprio usuário; team_members bloqueia UPDATE da linha do owner.

CREATE OR REPLACE FUNCTION public.admin_update_member_names(
  p_team_id UUID,
  p_member_user_id UUID,
  p_full_name TEXT,
  p_nickname TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_team_admin(p_team_id, auth.uid()) THEN
    RAISE EXCEPTION 'Apenas admins podem editar nomes dos jogadores.';
  END IF;

  IF NOT is_team_member(p_team_id, p_member_user_id) THEN
    RAISE EXCEPTION 'Membro não encontrado neste grupo.';
  END IF;

  IF p_full_name IS NULL OR length(trim(p_full_name)) < 2 THEN
    RAISE EXCEPTION 'Nome real precisa ter pelo menos 2 caracteres.';
  END IF;

  IF length(trim(p_full_name)) > 60 THEN
    RAISE EXCEPTION 'Nome real pode ter no máximo 60 caracteres.';
  END IF;

  IF p_nickname IS NOT NULL AND length(trim(p_nickname)) > 40 THEN
    RAISE EXCEPTION 'Apelido pode ter no máximo 40 caracteres.';
  END IF;

  UPDATE profiles
  SET full_name = trim(p_full_name)
  WHERE id = p_member_user_id;

  UPDATE team_members
  SET nickname = NULLIF(trim(COALESCE(p_nickname, '')), '')
  WHERE team_id = p_team_id
    AND user_id = p_member_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_member_names(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_member_names(UUID, UUID, TEXT, TEXT) TO authenticated;
