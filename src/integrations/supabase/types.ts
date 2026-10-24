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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      candidate_skills: {
        Row: {
          candidate_id: string
          category_code: string
          confidence: string
          evidence: string | null
          id: string
          skill_name: string
        }
        Insert: {
          candidate_id: string
          category_code: string
          confidence: string
          evidence?: string | null
          id?: string
          skill_name: string
        }
        Update: {
          candidate_id?: string
          category_code?: string
          confidence?: string
          evidence?: string | null
          id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_skills_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          certifications: Json
          created_at: string
          cv_file: string | null
          education: string | null
          email: string
          hackathons: Json
          id: string
          internships: Json
          name: string
          preferred_roles: Json
        }
        Insert: {
          certifications?: Json
          created_at?: string
          cv_file?: string | null
          education?: string | null
          email: string
          hackathons?: Json
          id?: string
          internships?: Json
          name: string
          preferred_roles?: Json
        }
        Update: {
          certifications?: Json
          created_at?: string
          cv_file?: string | null
          education?: string | null
          email?: string
          hackathons?: Json
          id?: string
          internships?: Json
          name?: string
          preferred_roles?: Json
        }
        Relationships: []
      }
      companies: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      company_skillsets: {
        Row: {
          category_code: string
          company: string
          id: string
          required_level: number
        }
        Insert: {
          category_code: string
          company: string
          id?: string
          required_level: number
        }
        Update: {
          category_code?: string
          company?: string
          id?: string
          required_level?: number
        }
        Relationships: []
      }
      jd_skills: {
        Row: {
          category_code: string
          confidence: string
          evidence: string | null
          id: string
          jd_id: string
          skill_name: string
        }
        Insert: {
          category_code: string
          confidence: string
          evidence?: string | null
          id?: string
          jd_id: string
          skill_name: string
        }
        Update: {
          category_code?: string
          confidence?: string
          evidence?: string | null
          id?: string
          jd_id?: string
          skill_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "jd_skills_jd_id_fkey"
            columns: ["jd_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          company: string | null
          created_at: string
          id: string
          role: string | null
          source_file: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          id?: string
          role?: string | null
          source_file: string
        }
        Update: {
          company?: string | null
          created_at?: string
          id?: string
          role?: string | null
          source_file?: string
        }
        Relationships: []
      }
      match_results: {
        Row: {
          candidate_id: string | null
          created_at: string
          id: string
          jd_id: string | null
          jd_source_file: string | null
          match_score: number
          matched_skills: Json
          missing_skills: Json
        }
        Insert: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          jd_id?: string | null
          jd_source_file?: string | null
          match_score: number
          matched_skills?: Json
          missing_skills?: Json
        }
        Update: {
          candidate_id?: string | null
          created_at?: string
          id?: string
          jd_id?: string | null
          jd_source_file?: string | null
          match_score?: number
          matched_skills?: Json
          missing_skills?: Json
        }
        Relationships: [
          {
            foreignKeyName: "match_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_results_jd_id_fkey"
            columns: ["jd_id"]
            isOneToOne: false
            referencedRelation: "job_descriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_categories: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      talent_result_gaps: {
        Row: {
          candidate_level: number
          category_code: string
          gap: boolean
          id: string
          required_level: number
          talent_result_id: string
        }
        Insert: {
          candidate_level: number
          category_code: string
          gap: boolean
          id?: string
          required_level: number
          talent_result_id: string
        }
        Update: {
          candidate_level?: number
          category_code?: string
          gap?: boolean
          id?: string
          required_level?: number
          talent_result_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "talent_result_gaps_talent_result_id_fkey"
            columns: ["talent_result_id"]
            isOneToOne: false
            referencedRelation: "talent_results"
            referencedColumns: ["id"]
          },
        ]
      }
      talent_results: {
        Row: {
          candidate_id: string | null
          company: string
          created_at: string
          id: string
          readiness_score: number
        }
        Insert: {
          candidate_id?: string | null
          company: string
          created_at?: string
          id?: string
          readiness_score: number
        }
        Update: {
          candidate_id?: string | null
          company?: string
          created_at?: string
          id?: string
          readiness_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "talent_results_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
