"use server";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { sendPushToUsers } from "@/lib/push";

export type PushActionResult = {
  error?: string;
  success?: string;
};

export type SerializedPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
};

export async function subscribePush(
  subscription: SerializedPushSubscription,
  userAgent?: string | null
): Promise<PushActionResult> {
  const user = await requireUser();

  if (!subscription?.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    return { error: "Subscription inválida." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: userAgent ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" }
  );

  if (error) return { error: error.message };
  return { success: "Notificações ativadas!" };
}

export async function unsubscribePush(
  endpoint?: string
): Promise<PushActionResult> {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (endpoint) {
    query = query.eq("endpoint", endpoint);
  }

  const { error } = await query;
  if (error) return { error: error.message };
  return { success: "Notificações desativadas." };
}

export async function getPushSubscriptionStatus(): Promise<{
  subscribed: boolean;
}> {
  const user = await requireUser();
  const supabase = await createClient();
  const { count } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return { subscribed: (count ?? 0) > 0 };
}

export async function sendTestPush(): Promise<PushActionResult> {
  const user = await requireUser();

  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return {
      error:
        "Push não configurado no servidor (VAPID / SERVICE_ROLE).",
    };
  }

  await sendPushToUsers([user.id], {
    title: "Só no Pelo FC",
    body: "Notificações funcionando! Hora da pelada ⚽",
    url: "/dashboard",
  });

  return { success: "Notificação de teste enviada." };
}
