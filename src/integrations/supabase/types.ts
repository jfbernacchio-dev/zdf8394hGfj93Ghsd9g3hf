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
      admin_access_log: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_patient_id: string | null
          accessed_user_id: string | null
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          retention_until: string | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_patient_id?: string | null
          accessed_user_id?: string | null
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          retention_until?: string | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_patient_id?: string | null
          accessed_user_id?: string | null
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          retention_until?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_access_log_accessed_patient_id_fkey"
            columns: ["accessed_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          description: string
          end_time: string
          id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          end_time: string
          id?: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          end_time?: string
          id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      backup_tests: {
        Row: {
          created_at: string
          data_integrity_verified: boolean
          details: string | null
          id: string
          restoration_time_seconds: number | null
          status: string
          test_date: string
          test_type: string
          tested_by: string | null
        }
        Insert: {
          created_at?: string
          data_integrity_verified?: boolean
          details?: string | null
          id?: string
          restoration_time_seconds?: number | null
          status: string
          test_date: string
          test_type?: string
          tested_by?: string | null
        }
        Update: {
          created_at?: string
          data_integrity_verified?: boolean
          details?: string | null
          id?: string
          restoration_time_seconds?: number | null
          status?: string
          test_date?: string
          test_type?: string
          tested_by?: string | null
        }
        Relationships: []
      }
      consent_submissions: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          guardian_document_path: string | null
          id: string
          ip_address: string | null
          patient_id: string
          submission_type: string
          token: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          guardian_document_path?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          submission_type: string
          token?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          guardian_document_path?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          submission_type?: string
          token?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_submissions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_logs: {
        Row: {
          created_at: string
          id: string
          invoice_text: string
          patient_count: number
          session_ids: string[]
          total_sessions: number
          total_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_text: string
          patient_count: number
          session_ids: string[]
          total_sessions: number
          total_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_text?: string
          patient_count?: number
          session_ids?: string[]
          total_sessions?: number
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      log_reviews: {
        Row: {
          actions_taken: string | null
          created_at: string
          findings: string | null
          id: string
          logs_reviewed: number
          review_period_end: string
          review_period_start: string
          reviewed_by: string
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          logs_reviewed?: number
          review_period_end: string
          review_period_start: string
          reviewed_by: string
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          logs_reviewed?: number
          review_period_end?: string
          review_period_start?: string
          reviewed_by?: string
        }
        Relationships: []
      }
      nfse_certificates: {
        Row: {
          certificate_data: string
          certificate_password: string
          certificate_type: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          certificate_data: string
          certificate_password: string
          certificate_type?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          certificate_data?: string
          certificate_password?: string
          certificate_type?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      nfse_config: {
        Row: {
          anexo_simples: string | null
          cnpj: string | null
          created_at: string
          focusnfe_environment: string | null
          focusnfe_token_homologacao: string | null
          focusnfe_token_production: string | null
          id: string
          inscricao_municipal: string | null
          iss_rate: number | null
          razao_social: string | null
          regime_tributario: string | null
          service_code: string | null
          service_description: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anexo_simples?: string | null
          cnpj?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          iss_rate?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          service_code?: string | null
          service_description?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anexo_simples?: string | null
          cnpj?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          iss_rate?: number | null
          razao_social?: string | null
          regime_tributario?: string | null
          service_code?: string | null
          service_description?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nfse_issued: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          environment: string
          error_message: string | null
          focusnfe_ref: string | null
          id: string
          iss_value: number
          issue_date: string
          net_value: number
          nfse_number: string | null
          patient_id: string
          pdf_url: string | null
          service_value: number
          session_ids: string[] | null
          status: string
          updated_at: string
          user_id: string
          verification_code: string | null
          xml_url: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          environment?: string
          error_message?: string | null
          focusnfe_ref?: string | null
          id?: string
          iss_value: number
          issue_date?: string
          net_value: number
          nfse_number?: string | null
          patient_id: string
          pdf_url?: string | null
          service_value: number
          session_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
          verification_code?: string | null
          xml_url?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          environment?: string
          error_message?: string | null
          focusnfe_ref?: string | null
          id?: string
          iss_value?: number
          issue_date?: string
          net_value?: number
          nfse_number?: string | null
          patient_id?: string
          pdf_url?: string | null
          service_value?: number
          session_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
          verification_code?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nfse_issued_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          patient_changes: boolean
          reschedules: boolean
          schedule_blocks: boolean
          session_changes: boolean
          therapist_id: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          patient_changes?: boolean
          reschedules?: boolean
          schedule_blocks?: boolean
          session_changes?: boolean
          therapist_id: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          patient_changes?: boolean
          reschedules?: boolean
          schedule_blocks?: boolean
          session_changes?: boolean
          therapist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      patient_files: {
        Row: {
          category: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          patient_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          category: string
          file_name: string
          file_path: string
          file_type: string
          id?: string
          patient_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          patient_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_patient"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          frequency: string
          guardian_cpf: string | null
          guardian_name: string | null
          hide_from_schedule: boolean | null
          hide_second_session_from_schedule: boolean | null
          id: string
          include_minor_text: boolean | null
          is_minor: boolean | null
          lgpd_consent_date: string | null
          monthly_price: boolean | null
          name: string
          nfse_issue_to: string | null
          no_nfse: boolean | null
          observations: string | null
          phone: string | null
          privacy_policy_accepted: boolean | null
          privacy_policy_accepted_at: string | null
          session_day: string | null
          session_day_2: string | null
          session_time: string | null
          session_time_2: string | null
          session_value: number
          start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          frequency: string
          guardian_cpf?: string | null
          guardian_name?: string | null
          hide_from_schedule?: boolean | null
          hide_second_session_from_schedule?: boolean | null
          id?: string
          include_minor_text?: boolean | null
          is_minor?: boolean | null
          lgpd_consent_date?: string | null
          monthly_price?: boolean | null
          name: string
          nfse_issue_to?: string | null
          no_nfse?: boolean | null
          observations?: string | null
          phone?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          session_day?: string | null
          session_day_2?: string | null
          session_time?: string | null
          session_time_2?: string | null
          session_value: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          frequency?: string
          guardian_cpf?: string | null
          guardian_name?: string | null
          hide_from_schedule?: boolean | null
          hide_second_session_from_schedule?: boolean | null
          id?: string
          include_minor_text?: boolean | null
          is_minor?: boolean | null
          lgpd_consent_date?: string | null
          monthly_price?: boolean | null
          name?: string
          nfse_issue_to?: string | null
          no_nfse?: boolean | null
          observations?: string | null
          phone?: string | null
          privacy_policy_accepted?: boolean | null
          privacy_policy_accepted_at?: string | null
          session_day?: string | null
          session_day_2?: string | null
          session_time?: string | null
          session_time_2?: string | null
          session_value?: number
          start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permission_reviews: {
        Row: {
          actions_taken: string | null
          created_at: string
          findings: string | null
          id: string
          next_review_date: string
          review_date: string
          reviewed_by: string
          roles_modified: number
          users_reviewed: number
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          next_review_date: string
          review_date: string
          reviewed_by: string
          roles_modified?: number
          users_reviewed?: number
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          findings?: string | null
          id?: string
          next_review_date?: string
          review_date?: string
          reviewed_by?: string
          roles_modified?: number
          users_reviewed?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string
          break_time: number | null
          cpf: string
          created_at: string
          created_by: string | null
          crp: string
          full_name: string
          id: string
          slot_duration: number | null
          updated_at: string
          work_days: number[] | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          birth_date: string
          break_time?: number | null
          cpf: string
          created_at?: string
          created_by?: string | null
          crp: string
          full_name: string
          id: string
          slot_duration?: number | null
          updated_at?: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          birth_date?: string
          break_time?: number | null
          cpf?: string
          created_at?: string
          created_by?: string | null
          crp?: string
          full_name?: string
          id?: string
          slot_duration?: number | null
          updated_at?: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      schedule_blocks: {
        Row: {
          created_at: string
          day_of_week: number
          end_date: string | null
          end_time: string
          id: string
          reason: string | null
          start_date: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_date?: string | null
          end_time: string
          id?: string
          reason?: string | null
          start_date?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_date?: string | null
          end_time?: string
          id?: string
          reason?: string | null
          start_date?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          affected_data_types: string[] | null
          affected_users_count: number | null
          anpd_notification_details: string | null
          anpd_notified_at: string | null
          contained_at: string | null
          containment_actions: string | null
          created_at: string
          data_sensitivity: string | null
          description: string
          detected_at: string
          evidence_links: string[] | null
          id: string
          incident_type: string
          internal_notes: string | null
          preventive_measures: string | null
          reported_by: string
          requires_anpd_notification: boolean | null
          resolution_actions: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          affected_data_types?: string[] | null
          affected_users_count?: number | null
          anpd_notification_details?: string | null
          anpd_notified_at?: string | null
          contained_at?: string | null
          containment_actions?: string | null
          created_at?: string
          data_sensitivity?: string | null
          description: string
          detected_at?: string
          evidence_links?: string[] | null
          id?: string
          incident_type: string
          internal_notes?: string | null
          preventive_measures?: string | null
          reported_by: string
          requires_anpd_notification?: boolean | null
          resolution_actions?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          affected_data_types?: string[] | null
          affected_users_count?: number | null
          anpd_notification_details?: string | null
          anpd_notified_at?: string | null
          contained_at?: string | null
          containment_actions?: string | null
          created_at?: string
          data_sensitivity?: string | null
          description?: string
          detected_at?: string
          evidence_links?: string[] | null
          id?: string
          incident_type?: string
          internal_notes?: string | null
          preventive_measures?: string | null
          reported_by?: string
          requires_anpd_notification?: boolean | null
          resolution_actions?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_history: {
        Row: {
          changed_at: string
          id: string
          new_day: string
          new_time: string
          old_day: string
          old_time: string
          patient_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_day: string
          new_time: string
          old_day: string
          old_time: string
          patient_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_day?: string
          new_time?: string
          old_day?: string
          old_time?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_history_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          paid: boolean | null
          patient_id: string
          show_in_schedule: boolean | null
          status: string
          time: string | null
          updated_at: string
          value: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          paid?: boolean | null
          patient_id: string
          show_in_schedule?: boolean | null
          status?: string
          time?: string | null
          updated_at?: string
          value: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          paid?: boolean | null
          patient_id?: string
          show_in_schedule?: boolean | null
          status?: string
          time?: string | null
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      system_notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          severity?: string
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      therapist_notifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          read: boolean
          therapist_id: string
          title: string
          type: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean
          therapist_id: string
          title: string
          type: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          therapist_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_cpf: { Args: { cpf_input: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "therapist"
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
      app_role: ["admin", "therapist"],
    },
  },
} as const
