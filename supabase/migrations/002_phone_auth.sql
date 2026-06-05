-- Migração: suporte a login por telefone
-- Execute no SQL Editor se já rodou o schema.sql anterior

-- Telefone no perfil; e-mail opcional (usuários SMS não têm e-mail)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;

-- Atualiza trigger de criação de perfil
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
