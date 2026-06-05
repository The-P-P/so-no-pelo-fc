-- Permite upsert de pesos quando o registro ainda não existe (grupos antigos).
CREATE POLICY "Admin insere pesos de stats"
  ON team_stat_weights FOR INSERT
  WITH CHECK (is_team_admin(team_id, auth.uid()));
