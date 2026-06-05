-- Admin pode lançar stats aprovadas para membros reais (não só fictícios)

CREATE POLICY "Admin lança stats de membros"
  ON player_stats FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND fictional_player_id IS NULL
    AND is_team_admin(get_pelada_team_id(pelada_id), auth.uid())
  );
