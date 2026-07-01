/**
 * Tipos gerados manualmente espelhando o schema Supabase.
 * Em produção, use: npx supabase gen types typescript
 */

export type TeamRole = "owner" | "admin" | "player";
export type StatStatus = "pending" | "approved" | "rejected";
export type ProfileChangeType = "full_name" | "nickname";

export type AssignmentSnapshot = {
  team_index: number;
  user_id: string | null;
  fictional_player_id: string | null;
  sort_order: number;
};

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
          player_invite_token: string;
          admin_invite_token: string;
          ranked_top_tier_name: string;
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
          player_invite_token?: string;
          admin_invite_token?: string;
          ranked_top_tier_name?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          ranked_top_tier_name?: string;
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
      profile_change_requests: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          change_type: ProfileChangeType;
          requested_value: string;
          status: StatStatus;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          change_type: ProfileChangeType;
          requested_value: string;
          status?: StatStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          requested_value?: string;
          status?: StatStatus;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_change_requests_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_change_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fictional_players: {
        Row: {
          id: string;
          team_id: string;
          display_name: string;
          nickname: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          display_name: string;
          nickname?: string | null;
          created_at?: string;
        };
        Update: {
          display_name?: string;
          nickname?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fictional_players_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      team_stat_weights: {
        Row: {
          team_id: string;
          goals: number;
          assists: number;
          god_saves: number;
          vacilos: number;
          own_goals: number;
          updated_at: string;
        };
        Insert: {
          team_id: string;
          goals?: number;
          assists?: number;
          god_saves?: number;
          vacilos?: number;
          own_goals?: number;
          updated_at?: string;
        };
        Update: {
          goals?: number;
          assists?: number;
          god_saves?: number;
          vacilos?: number;
          own_goals?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_stat_weights_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
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
      pelada_attendance: {
        Row: {
          id: string;
          pelada_id: string;
          user_id: string;
          present: boolean;
          marked_by: string;
          marked_at: string;
        };
        Insert: {
          id?: string;
          pelada_id: string;
          user_id: string;
          present?: boolean;
          marked_by: string;
          marked_at?: string;
        };
        Update: {
          present?: boolean;
          marked_by?: string;
          marked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pelada_attendance_pelada_id_fkey";
            columns: ["pelada_id"];
            referencedRelation: "peladas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pelada_attendance_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      pelada_team_drafts: {
        Row: {
          pelada_id: string;
          players_per_team: number;
          skill_metric: string;
          original_assignments: AssignmentSnapshot[] | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          pelada_id: string;
          players_per_team?: number;
          skill_metric?: string;
          original_assignments?: AssignmentSnapshot[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          players_per_team?: number;
          skill_metric?: string;
          original_assignments?: AssignmentSnapshot[] | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pelada_team_drafts_pelada_id_fkey";
            columns: ["pelada_id"];
            referencedRelation: "peladas";
            referencedColumns: ["id"];
          },
        ];
      };
      pelada_team_assignments: {
        Row: {
          id: string;
          pelada_id: string;
          team_index: number;
          user_id: string | null;
          fictional_player_id: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          pelada_id: string;
          team_index: number;
          user_id?: string | null;
          fictional_player_id?: string | null;
          sort_order?: number;
        };
        Update: {
          team_index?: number;
          user_id?: string | null;
          fictional_player_id?: string | null;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pelada_team_assignments_pelada_id_fkey";
            columns: ["pelada_id"];
            referencedRelation: "peladas";
            referencedColumns: ["id"];
          },
        ];
      };
      player_stats: {
        Row: {
          id: string;
          pelada_id: string;
          user_id: string | null;
          fictional_player_id: string | null;
          goals: number;
          assists: number;
          god_saves: number;
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
          user_id?: string | null;
          fictional_player_id?: string | null;
          goals?: number;
          assists?: number;
          god_saves?: number;
          own_goals?: number;
          vacilos?: number;
          vacilo_description?: string | null;
          observation?: string | null;
          status?: StatStatus;
        };
        Update: {
          goals?: number;
          assists?: number;
          god_saves?: number;
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
      ranked_seasons: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          is_active: boolean;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          is_active?: boolean;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          name?: string;
          is_active?: boolean;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ranked_seasons_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      pelada_victories: {
        Row: {
          id: string;
          season_id: string;
          pelada_id: string;
          user_id: string;
          pdl_points: number;
          marked_by: string;
          marked_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          pelada_id: string;
          user_id: string;
          pdl_points?: number;
          marked_by: string;
          marked_at?: string;
        };
        Update: {
          pdl_points?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      ranking_pdl: {
        Row: {
          team_id: string;
          season_id: string;
          user_id: string;
          full_name: string | null;
          avatar_url: string | null;
          nickname: string | null;
          total_pdl: number;
          victories: number;
        };
        Relationships: [];
      };
      ranking_geral: {
        Row: {
          team_id: string;
          participant_id: string;
          participant_type: string;
          full_name: string | null;
          avatar_url: string | null;
          nickname: string | null;
          total_goals: number;
          total_assists: number;
          total_god_saves: number;
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
          participant_id: string;
          participant_type: string;
          full_name: string | null;
          avatar_url: string | null;
          nickname: string | null;
          goals: number;
          assists: number;
          god_saves: number;
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
      join_team_via_invite: {
        Args: { p_token: string; p_nickname?: string | null };
        Returns: string;
      };
      transfer_team_ownership: {
        Args: { p_team_id: string; p_new_owner_id: string };
        Returns: undefined;
      };
      leave_team: {
        Args: { p_team_id: string };
        Returns: undefined;
      };
      get_team_by_invite_token: {
        Args: { p_token: string };
        Returns: {
          id: string;
          name: string;
          invite_role: TeamRole;
        }[];
      };
    };
    Enums: {
      team_role: TeamRole;
      stat_status: StatStatus;
    };
  };
}
