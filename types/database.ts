/**
 * Tipos gerados manualmente espelhando o schema Supabase.
 * Em produção, use: npx supabase gen types typescript
 */

export type TeamRole = "owner" | "admin" | "player";
export type StatStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          nickname: string | null;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: TeamRole;
          nickname?: string | null;
          joined_at?: string;
        };
        Update: {
          role?: TeamRole;
          nickname?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      peladas: {
        Row: {
          id: string;
          team_id: string;
          date: string;
          opponent: string;
          score_home: number;
          score_away: number;
          location: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          date: string;
          opponent: string;
          score_home?: number;
          score_away?: number;
          location?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          date?: string;
          opponent?: string;
          score_home?: number;
          score_away?: number;
          location?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "peladas_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      player_stats: {
        Row: {
          id: string;
          pelada_id: string;
          user_id: string;
          goals: number;
          assists: number;
          own_goals: number;
          vacilos: number;
          vacilo_description: string | null;
          observation: string | null;
          status: StatStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pelada_id: string;
          user_id: string;
          goals?: number;
          assists?: number;
          own_goals?: number;
          vacilos?: number;
          vacilo_description?: string | null;
          observation?: string | null;
          status?: StatStatus;
        };
        Update: {
          goals?: number;
          assists?: number;
          own_goals?: number;
          vacilos?: number;
          vacilo_description?: string | null;
          observation?: string | null;
          status?: StatStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "player_stats_pelada_id_fkey";
            columns: ["pelada_id"];
            referencedRelation: "peladas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      ranking_geral: {
        Row: {
          team_id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          nickname: string | null;
          total_goals: number;
          total_assists: number;
          total_own_goals: number;
          total_vacilos: number;
          peladas_jogadas: number;
        };
        Relationships: [];
      };
      ranking_pelada: {
        Row: {
          pelada_id: string;
          team_id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          nickname: string | null;
          goals: number;
          assists: number;
          own_goals: number;
          vacilos: number;
          vacilo_description: string | null;
          observation: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_team_role: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: TeamRole;
      };
      is_team_admin: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
      is_team_member: {
        Args: { p_team_id: string; p_user_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      team_role: TeamRole;
      stat_status: StatStatus;
    };
  };
}
