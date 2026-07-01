import type { Database, TeamRole, StatStatus, ProfileChangeType } from "./database";
import type { StatField } from "@/lib/stats";

// Re-exporta tipos do banco
export type { Database, TeamRole, StatStatus, ProfileChangeType, StatField };

// Tipos de domínio (entidades da aplicação)
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type FictionalPlayer =
  Database["public"]["Tables"]["fictional_players"]["Row"];
export type TeamStatWeights =
  Database["public"]["Tables"]["team_stat_weights"]["Row"];
export type Pelada = Database["public"]["Tables"]["peladas"]["Row"];
export type PeladaAttendance =
  Database["public"]["Tables"]["pelada_attendance"]["Row"];
export type PeladaTeamDraft =
  Database["public"]["Tables"]["pelada_team_drafts"]["Row"];
export type PeladaTeamAssignment =
  Database["public"]["Tables"]["pelada_team_assignments"]["Row"];
export type PlayerStat = Database["public"]["Tables"]["player_stats"]["Row"];
export type RankingGeral = Database["public"]["Views"]["ranking_geral"]["Row"];
export type RankingPelada = Database["public"]["Views"]["ranking_pelada"]["Row"];
export type RankingPdl = Database["public"]["Views"]["ranking_pdl"]["Row"];
export type RankedSeason = Database["public"]["Tables"]["ranked_seasons"]["Row"];

export type ParticipantType = "member" | "fictional";

export type Participant = {
  id: string;
  type: ParticipantType;
  displayName: string;
  nickname: string | null;
};

export type AttendanceMember = {
  userId: string;
  displayName: string;
  nickname: string | null;
  avatarUrl: string | null;
  present: boolean;
  hasMarked: boolean;
};

export type TeamDistributionPlayer = {
  participantId: string;
  participantType: ParticipantType;
  displayName: string;
  avatarUrl: string | null;
  skill: number;
  peladasJogadas: number;
};

export type TeamDistribution = {
  playersPerTeam: number;
  teams: TeamDistributionPlayer[][];
  teamTotals: number[];
  unassignedPlayers: TeamDistributionPlayer[];
  presentCount: number;
  hasOriginalSnapshot: boolean;
  hasManualChanges: boolean;
};

export type RankingEntry = RankingGeral & {
  displayName: string;
  score: number;
  total_peladas: number;
};

// Tipos compostos (joins frequentes)
export type TeamMemberWithProfile = TeamMember & {
  profile: Pick<Profile, "id" | "full_name" | "email" | "phone" | "avatar_url">;
};

export type PeladaWithStats = Pelada & {
  player_stats: (PlayerStat & {
    profile: Pick<Profile, "full_name" | "avatar_url">;
  })[];
};

export type TeamWithMembers = Team & {
  members: TeamMemberWithProfile[];
  member_count: number;
};

// Permissões derivadas do role
export type TeamPermissions = {
  canManageTeam: boolean;
  canCreatePelada: boolean;
  canApproveStats: boolean;
  canManageMembers: boolean;
  canPromoteAdmin: boolean;
  isOwner: boolean;
};

/** Calcula permissões a partir do role do membro */
export function getTeamPermissions(role: TeamRole): TeamPermissions {
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || isOwner;

  return {
    canManageTeam: isAdmin,
    canCreatePelada: isAdmin,
    canApproveStats: isAdmin,
    canManageMembers: isAdmin,
    canPromoteAdmin: isAdmin,
    isOwner,
  };
}

// Labels amigáveis para a UI
export const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Dono",
  admin: "Admin",
  player: "Jogador",
};

export const STAT_STATUS_LABELS: Record<StatStatus, string> = {
  pending: "Aguardando aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

// Formulários
export type PhoneLoginFormData = {
  phone: string;
  fullName?: string;
};

export type OtpVerifyFormData = {
  phone: string;
  otp: string;
};

export type CreatePeladaFormData = {
  date: string;
  location?: string;
  description?: string;
};

export type PlayerStatFormData = {
  goals: number;
  assists: number;
  godSaves: number;
  ownGoals: number;
  vacilos: number;
  vaciloDescription?: string;
  observation?: string;
};

// Navegação da sidebar
export type NavItem = {
  title: string;
  href: string;
  icon: string;
  adminOnly?: boolean;
};
