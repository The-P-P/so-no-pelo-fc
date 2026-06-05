import { cookies } from "next/headers";

export const ACTIVE_TEAM_COOKIE = "spfc_active_team";

export async function getActiveTeamIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_TEAM_COOKIE)?.value ?? null;
}
