-- Permite que o usuário crie o próprio perfil se o trigger falhar (ex: login por telefone)
CREATE POLICY "Usuário cria próprio perfil"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());
