-- Corrige "Database error saving new user" no cadastro por SMS.
-- Causa comum: profiles.email ainda NOT NULL ou trigger handle_new_user ausente/desatualizado.
-- Execute no SQL Editor do Supabase (projeto fxafqrzgofwyiaaktkle).

-- Usuários por telefone não têm e-mail
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone)
  WHERE phone IS NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "Usuário cria próprio perfil" ON public.profiles;

CREATE POLICY "Usuário cria próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());
