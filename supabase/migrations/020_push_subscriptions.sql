-- Push subscriptions for Web Push notifications (idempotent)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT push_subscriptions_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON push_subscriptions (user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários leem próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários leem próprias subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários criam próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários criam próprias subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários atualizam próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários atualizam próprias subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Usuários removem próprias subscriptions" ON push_subscriptions;
CREATE POLICY "Usuários removem próprias subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());
