import type { Database, TeamRole, StatStatus } from "./database";

// Re-exporta tipos do banco
export type { Database, TeamRole, StatStatus };

// Tipos de domínio (entidades da aplicação)
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type Pelada = Database["public"]["Tables"]["peladas"]["Row"];
export type PlayerStat = Database["public"]["Tables"]["player_stats"]["Row"];
export type RankingGeral = Database["public"]["Views"]["ranking_geral"]["Row"];
export type RankingPelada = Database["public"]["Views"]["ranking_pelada"]["Row"];

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
  opponent: string;
  scoreHome: number;
  scoreAway: number;
  location?: string;
  notes?: string;
};

export type PlayerStatFormData = {
  goals: number;
  assists: number;
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
