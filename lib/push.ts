import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
};

type SubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@sonopelofc.app";

  if (!publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function sendToSubscription(
  sub: SubscriptionRow,
  payload: PushPayload
): Promise<"ok" | "gone" | "error"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/dashboard",
        icon: payload.icon ?? "/icons/icon-192.png",
        badge: payload.badge ?? "/icons/icon-192.png",
      })
    );
    return "ok";
  } catch (error) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : null;

    if (statusCode === 404 || statusCode === 410) {
      return "gone";
    }

    console.error("Falha ao enviar push:", error);
    return "error";
  }
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0 || !isPushConfigured() || !configureVapid()) {
    return;
  }

  try {
    const admin = createAdminClient();
    const { data: subscriptions, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", uniqueIds);

    if (error || !subscriptions?.length) {
      if (error) console.error("Erro ao buscar subscriptions:", error.message);
      return;
    }

    const staleIds: string[] = [];

    await Promise.all(
      subscriptions.map(async (sub) => {
        const result = await sendToSubscription(sub, payload);
        if (result === "gone") staleIds.push(sub.id);
      })
    );

    if (staleIds.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", staleIds);
    }
  } catch (error) {
    console.error("Push não enviado:", error);
  }
}

export async function sendPushToTeamMembers(
  teamId: string,
  payload: PushPayload,
  options?: { excludeUserIds?: string[]; roles?: Array<"owner" | "admin" | "player"> }
): Promise<void> {
  if (!isPushConfigured()) return;

  try {
    const admin = createAdminClient();
    let query = admin
      .from("team_members")
      .select("user_id, role")
      .eq("team_id", teamId);

    if (options?.roles?.length) {
      query = query.in("role", options.roles);
    }

    const { data: members, error } = await query;
    if (error || !members?.length) {
      if (error) console.error("Erro ao buscar membros:", error.message);
      return;
    }

    const exclude = new Set(options?.excludeUserIds ?? []);
    const userIds = members
      .map((m) => m.user_id)
      .filter((id) => !exclude.has(id));

    await sendPushToUsers(userIds, payload);
  } catch (error) {
    console.error("Push para time não enviado:", error);
  }
}

/** Fire-and-forget wrapper — never throws to callers. */
export function notifyUsers(userIds: string[], payload: PushPayload) {
  void sendPushToUsers(userIds, payload).catch((error) => {
    console.error("notifyUsers falhou:", error);
  });
}

export function notifyTeamMembers(
  teamId: string,
  payload: PushPayload,
  options?: { excludeUserIds?: string[]; roles?: Array<"owner" | "admin" | "player"> }
) {
  void sendPushToTeamMembers(teamId, payload, options).catch((error) => {
    console.error("notifyTeamMembers falhou:", error);
  });
}
