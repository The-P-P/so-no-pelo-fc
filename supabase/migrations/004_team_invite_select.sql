-- Permite usuários autenticados buscarem times pelo slug (entrar via convite)
CREATE POLICY "Autenticados podem buscar times para entrar"
  ON teams FOR SELECT
  USING (auth.uid() IS NOT NULL);
