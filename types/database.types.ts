export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      missions: {
        Row: {
          active_from: string
          active_to: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          max_completions: number
          period: Database["public"]["Enums"]["mission_period"]
          reward_exp: number
          title: string
          type: Database["public"]["Enums"]["mission_type"]
          updated_at: string | null
        }
        Insert: {
          active_from: string
          active_to: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number
          period: Database["public"]["Enums"]["mission_period"]
          reward_exp: number
          title: string
          type: Database["public"]["Enums"]["mission_type"]
          updated_at?: string | null
        }
        Update: {
          active_from?: string
          active_to?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_completions?: number
          period?: Database["public"]["Enums"]["mission_period"]
          reward_exp?: number
          title?: string
          type?: Database["public"]["Enums"]["mission_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      pet_stages: {
        Row: {
          animation_key: string | null
          created_at: string | null
          effect_asset: string | null
          id: number
          image_url: string | null
          min_total_exp: number
          name: string
          updated_at: string | null
        }
        Insert: {
          animation_key?: string | null
          created_at?: string | null
          effect_asset?: string | null
          id: number
          image_url?: string | null
          min_total_exp: number
          name: string
          updated_at?: string | null
        }
        Update: {
          animation_key?: string | null
          created_at?: string | null
          effect_asset?: string | null
          id?: number
          image_url?: string | null
          min_total_exp?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pets: {
        Row: {
          created_at: string | null
          current_stage_id: number
          id: string
          total_exp: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stage_id: number
          id?: string
          total_exp?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stage_id?: number
          id?: string
          total_exp?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pets_current_stage_id_fkey"
            columns: ["current_stage_id"]
            isOneToOne: false
            referencedRelation: "pet_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string
          completion_ref: string
          created_at: string | null
          id: string
          mission_id: string
          reward_exp: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          completion_ref?: string
          created_at?: string | null
          id?: string
          mission_id: string
          reward_exp: number
          user_id: string
        }
        Update: {
          completed_at?: string
          completion_ref?: string
          created_at?: string | null
          id?: string
          mission_id?: string
          reward_exp?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_fk"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_mission: {
        Args: {
          p_completion_date?: string
          p_mission_id: string
          p_user_id?: string
        }
        Returns: {
          completed_count: number
          earned_exp: number
          new_stage: number
          next_stage_threshold: number
          old_stage: number
          remaining_count: number
          total_exp: number
        }[]
      }
    }
    Enums: {
      mission_period: "daily" | "once" | "event"
      mission_type: "check_in" | "core" | "event"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      mission_period: ["daily", "once", "event"],
      mission_type: ["check_in", "core", "event"],
    },
  },
} as const
