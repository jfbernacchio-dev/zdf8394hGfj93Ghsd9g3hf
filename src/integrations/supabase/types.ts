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
      accountant_requests: {
        Row: {
          accountant_id: string
          created_at: string
          id: string
          requested_at: string
          responded_at: string | null
          status: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          accountant_id: string
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          accountant_id?: string
          created_at?: string
          id?: string
          requested_at?: string
          responded_at?: string | null
          status?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      accountant_therapist_assignments: {
        Row: {
          accountant_id: string
          created_at: string
          id: string
          therapist_id: string
          updated_at: string
        }
        Insert: {
          accountant_id: string
          created_at?: string
          id?: string
          therapist_id: string
          updated_at?: string
        }
        Update: {
          accountant_id?: string
          created_at?: string
          id?: string
          therapist_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accountant_therapist_assignments_accountant_id_fkey"
            columns: ["accountant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accountant_therapist_assignments_therapist_id_fkey"
            columns: ["therapist_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      active_profile_state: {
        Row: {
          active_profile_id: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_profile_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_profile_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_profile_state_active_profile_id_fkey"
            columns: ["active_profile_id"]
            isOneToOne: false
            referencedRelation: "layout_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
      cid_catalog: {
        Row: {
          changed_at: string | null
          code: string
          created_at: string | null
          fetched_at: string | null
          group_code: string | null
          group_name: string | null
          id: string
          source: string | null
          title: string
          version: string | null
        }
        Insert: {
          changed_at?: string | null
          code: string
          created_at?: string | null
          fetched_at?: string | null
          group_code?: string | null
          group_name?: string | null
          id?: string
          source?: string | null
          title: string
          version?: string | null
        }
        Update: {
          changed_at?: string | null
          code?: string
          created_at?: string | null
          fetched_at?: string | null
          group_code?: string | null
          group_name?: string | null
          id?: string
          source?: string | null
          title?: string
          version?: string | null
        }
        Relationships: []
      }
      cid_symptom_packs: {
        Row: {
          code: string | null
          created_at: string | null
          group_code: string | null
          id: string
          is_custom: boolean | null
          specifiers: Json | null
          symptoms: Json
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          group_code?: string | null
          id?: string
          is_custom?: boolean | null
          specifiers?: Json | null
          symptoms?: Json
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          group_code?: string | null
          id?: string
          is_custom?: boolean | null
          specifiers?: Json | null
          symptoms?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      clinical_approaches: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          professional_role_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          professional_role_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          professional_role_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_approaches_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_complaints: {
        Row: {
          aggressiveness: string | null
          cid_code: string | null
          cid_group: string | null
          cid_title: string | null
          clinical_notes: string | null
          comorbidities: Json | null
          course: string | null
          created_at: string | null
          created_by: string
          functional_impairment: string | null
          has_no_diagnosis: boolean | null
          id: string
          is_active: boolean | null
          onset_duration_weeks: number | null
          onset_type: string | null
          organization_id: string | null
          patient_id: string
          reported_by: string | null
          severity: string | null
          suicidality: string | null
          updated_at: string | null
          vulnerabilities: string[] | null
        }
        Insert: {
          aggressiveness?: string | null
          cid_code?: string | null
          cid_group?: string | null
          cid_title?: string | null
          clinical_notes?: string | null
          comorbidities?: Json | null
          course?: string | null
          created_at?: string | null
          created_by: string
          functional_impairment?: string | null
          has_no_diagnosis?: boolean | null
          id?: string
          is_active?: boolean | null
          onset_duration_weeks?: number | null
          onset_type?: string | null
          organization_id?: string | null
          patient_id: string
          reported_by?: string | null
          severity?: string | null
          suicidality?: string | null
          updated_at?: string | null
          vulnerabilities?: string[] | null
        }
        Update: {
          aggressiveness?: string | null
          cid_code?: string | null
          cid_group?: string | null
          cid_title?: string | null
          clinical_notes?: string | null
          comorbidities?: Json | null
          course?: string | null
          created_at?: string | null
          created_by?: string
          functional_impairment?: string | null
          has_no_diagnosis?: boolean | null
          id?: string
          is_active?: boolean | null
          onset_duration_weeks?: number | null
          onset_type?: string | null
          organization_id?: string | null
          patient_id?: string
          reported_by?: string | null
          severity?: string | null
          suicidality?: string | null
          updated_at?: string | null
          vulnerabilities?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_complaints_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_medications: {
        Row: {
          adverse_effects: string | null
          class: string
          complaint_id: string
          created_at: string | null
          dosage: string | null
          end_date: string | null
          frequency: string | null
          id: string
          is_current: boolean | null
          notes: string | null
          organization_id: string | null
          start_date: string | null
          substance: string | null
        }
        Insert: {
          adverse_effects?: string | null
          class: string
          complaint_id: string
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          organization_id?: string | null
          start_date?: string | null
          substance?: string | null
        }
        Update: {
          adverse_effects?: string | null
          class?: string
          complaint_id?: string
          created_at?: string | null
          dosage?: string | null
          end_date?: string | null
          frequency?: string | null
          id?: string
          is_current?: boolean | null
          notes?: string | null
          organization_id?: string | null
          start_date?: string | null
          substance?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_medications_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "clinical_complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_specifiers: {
        Row: {
          complaint_id: string
          created_at: string | null
          id: string
          organization_id: string | null
          specifier_type: string
          specifier_value: string
        }
        Insert: {
          complaint_id: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          specifier_type: string
          specifier_value: string
        }
        Update: {
          complaint_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          specifier_type?: string
          specifier_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_specifiers_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "clinical_complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_symptoms: {
        Row: {
          category: string | null
          complaint_id: string
          created_at: string | null
          frequency: string | null
          id: string
          intensity: number | null
          is_present: boolean | null
          notes: string | null
          organization_id: string | null
          symptom_label: string
        }
        Insert: {
          category?: string | null
          complaint_id: string
          created_at?: string | null
          frequency?: string | null
          id?: string
          intensity?: number | null
          is_present?: boolean | null
          notes?: string | null
          organization_id?: string | null
          symptom_label: string
        }
        Update: {
          category?: string | null
          complaint_id?: string
          created_at?: string | null
          frequency?: string | null
          id?: string
          intensity?: number | null
          is_present?: boolean | null
          notes?: string | null
          organization_id?: string | null
          symptom_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_symptoms_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "clinical_complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_submissions: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          guardian_document_path: string | null
          id: string
          ip_address: string | null
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          patient_count?: number
          session_ids?: string[]
          total_sessions?: number
          total_value?: number
          user_id?: string
        }
        Relationships: []
      }
      layout_backups: {
        Row: {
          created_at: string | null
          id: string
          layout_config: Json
          layout_type: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          layout_config: Json
          layout_type: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          layout_config?: Json
          layout_type?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      layout_profiles: {
        Row: {
          created_at: string | null
          id: string
          layout_configs: Json
          profile_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          layout_configs: Json
          profile_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          layout_configs?: Json
          profile_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      level_permission_sets: {
        Row: {
          access_level: string
          created_at: string
          domain: string
          has_financial_access: boolean | null
          id: string
          level_id: string
          manages_own_patients: boolean | null
          nfse_emission_mode: string | null
          updated_at: string
        }
        Insert: {
          access_level: string
          created_at?: string
          domain: string
          has_financial_access?: boolean | null
          id?: string
          level_id: string
          manages_own_patients?: boolean | null
          nfse_emission_mode?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          domain?: string
          has_financial_access?: boolean | null
          id?: string
          level_id?: string
          manages_own_patients?: boolean | null
          nfse_emission_mode?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_permission_sets_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "organization_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_role_settings: {
        Row: {
          can_access_clinical: boolean
          can_access_marketing: boolean
          can_access_whatsapp: boolean
          can_edit_schedules: boolean
          can_manage_subordinate_whatsapp: boolean
          can_view_subordinate_whatsapp: boolean
          can_view_team_financial_summary: boolean
          clinical_visible_to_superiors: boolean
          created_at: string
          financial_access: string
          id: string
          level_id: string
          peer_agenda_sharing: boolean
          peer_clinical_sharing: string
          role_type: Database["public"]["Enums"]["app_role"]
          secretary_can_access_whatsapp: boolean
          updated_at: string
          uses_org_company_for_nfse: boolean
        }
        Insert: {
          can_access_clinical?: boolean
          can_access_marketing?: boolean
          can_access_whatsapp?: boolean
          can_edit_schedules?: boolean
          can_manage_subordinate_whatsapp?: boolean
          can_view_subordinate_whatsapp?: boolean
          can_view_team_financial_summary?: boolean
          clinical_visible_to_superiors?: boolean
          created_at?: string
          financial_access?: string
          id?: string
          level_id: string
          peer_agenda_sharing?: boolean
          peer_clinical_sharing?: string
          role_type: Database["public"]["Enums"]["app_role"]
          secretary_can_access_whatsapp?: boolean
          updated_at?: string
          uses_org_company_for_nfse?: boolean
        }
        Update: {
          can_access_clinical?: boolean
          can_access_marketing?: boolean
          can_access_whatsapp?: boolean
          can_edit_schedules?: boolean
          can_manage_subordinate_whatsapp?: boolean
          can_view_subordinate_whatsapp?: boolean
          can_view_team_financial_summary?: boolean
          clinical_visible_to_superiors?: boolean
          created_at?: string
          financial_access?: string
          id?: string
          level_id?: string
          peer_agenda_sharing?: boolean
          peer_clinical_sharing?: string
          role_type?: Database["public"]["Enums"]["app_role"]
          secretary_can_access_whatsapp?: boolean
          updated_at?: string
          uses_org_company_for_nfse?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "level_role_settings_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "organization_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      level_sharing_config: {
        Row: {
          created_at: string
          id: string
          level_id: string
          shared_domains: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          shared_domains?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          shared_domains?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "level_sharing_config_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: true
            referencedRelation: "organization_levels"
            referencedColumns: ["id"]
          },
        ]
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
      medication_catalog: {
        Row: {
          cid_codes: string[] | null
          class: string
          created_at: string | null
          id: string
          indications: Json
          is_common: boolean | null
          substance: string
        }
        Insert: {
          cid_codes?: string[] | null
          class: string
          created_at?: string | null
          id?: string
          indications?: Json
          is_common?: boolean | null
          substance: string
        }
        Update: {
          cid_codes?: string[] | null
          class?: string
          created_at?: string | null
          id?: string
          indications?: Json
          is_common?: boolean | null
          substance?: string
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
          is_legacy: boolean | null
          organization_id: string | null
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
          is_legacy?: boolean | null
          organization_id?: string | null
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
          is_legacy?: boolean | null
          organization_id?: string | null
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
          codigo_municipio: string | null
          created_at: string
          focusnfe_environment: string | null
          focusnfe_token_homologacao: string | null
          focusnfe_token_production: string | null
          id: string
          inscricao_municipal: string | null
          is_legacy: boolean | null
          iss_rate: number | null
          organization_id: string | null
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
          codigo_municipio?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          is_legacy?: boolean | null
          iss_rate?: number | null
          organization_id?: string | null
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
          codigo_municipio?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          is_legacy?: boolean | null
          iss_rate?: number | null
          organization_id?: string | null
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
          organization_id: string | null
          patient_cpf: string | null
          patient_id: string
          patient_name: string | null
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
          organization_id?: string | null
          patient_cpf?: string | null
          patient_id: string
          patient_name?: string | null
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
          organization_id?: string | null
          patient_cpf?: string | null
          patient_id?: string
          patient_name?: string | null
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
      nfse_payments: {
        Row: {
          amount: number
          created_at: string
          has_proof: boolean
          id: string
          notes: string | null
          organization_id: string | null
          payment_date: string
          payment_method: string
          proof_file_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          has_proof?: boolean
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_date: string
          payment_method: string
          proof_file_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          has_proof?: boolean
          id?: string
          notes?: string | null
          organization_id?: string | null
          payment_date?: string
          payment_method?: string
          proof_file_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      organization_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_name: string
          level_number: number
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_name: string
          level_number: number
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_name?: string
          level_number?: number
          organization_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_nfse_config: {
        Row: {
          anexo_simples: string | null
          certificate_data: string | null
          certificate_password: string | null
          certificate_type: string | null
          cnpj: string | null
          codigo_municipio: string | null
          created_at: string
          focusnfe_environment: string | null
          focusnfe_token_homologacao: string | null
          focusnfe_token_production: string | null
          id: string
          inscricao_municipal: string | null
          iss_rate: number | null
          organization_id: string
          razao_social: string | null
          regime_tributario: string | null
          service_code: string | null
          service_description: string | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          anexo_simples?: string | null
          certificate_data?: string | null
          certificate_password?: string | null
          certificate_type?: string | null
          cnpj?: string | null
          codigo_municipio?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          iss_rate?: number | null
          organization_id: string
          razao_social?: string | null
          regime_tributario?: string | null
          service_code?: string | null
          service_description?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          anexo_simples?: string | null
          certificate_data?: string | null
          certificate_password?: string | null
          certificate_type?: string | null
          cnpj?: string | null
          codigo_municipio?: string | null
          created_at?: string
          focusnfe_environment?: string | null
          focusnfe_token_homologacao?: string | null
          focusnfe_token_production?: string | null
          id?: string
          inscricao_municipal?: string | null
          iss_rate?: number | null
          organization_id?: string
          razao_social?: string | null
          regime_tributario?: string | null
          service_code?: string | null
          service_description?: string | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_nfse_config_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_owners: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_owners_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_positions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          level_id: string
          parent_position_id: string | null
          position_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          level_id: string
          parent_position_id?: string | null
          position_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          level_id?: string
          parent_position_id?: string | null
          position_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_positions_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "organization_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_positions_parent_position_id_fkey"
            columns: ["parent_position_id"]
            isOneToOne: false
            referencedRelation: "organization_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          cnpj: string
          created_at: string
          created_by: string | null
          id: string
          legal_name: string
          notes: string | null
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          cnpj: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name: string
          notes?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          cnpj?: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string
          notes?: string | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      patient_complaints: {
        Row: {
          complaint_text: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          next_review_date: string
          patient_id: string
          updated_at: string
        }
        Insert: {
          complaint_text?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          next_review_date: string
          patient_id: string
          updated_at?: string
        }
        Update: {
          complaint_text?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          next_review_date?: string
          patient_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_complaints_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_files: {
        Row: {
          category: string
          file_name: string
          file_path: string
          file_type: string
          id: string
          is_clinical: boolean | null
          organization_id: string | null
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
          is_clinical?: boolean | null
          organization_id?: string | null
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
          is_clinical?: boolean | null
          organization_id?: string | null
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
      patient_overview_layouts: {
        Row: {
          created_at: string
          id: string
          layout_json: Json
          organization_id: string | null
          patient_id: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          layout_json?: Json
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          layout_json?: Json
          organization_id?: string | null
          patient_id?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      patients: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string | null
          frequency: string
          guardian_cpf: string | null
          guardian_cpf_2: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_name_2: string | null
          guardian_phone_1: string | null
          guardian_phone_2: string | null
          hide_from_schedule: boolean | null
          hide_second_session_from_schedule: boolean | null
          id: string
          include_minor_text: boolean | null
          is_minor: boolean | null
          lgpd_consent_date: string | null
          monthly_price: boolean | null
          name: string
          nfse_alternate_email: string | null
          nfse_alternate_phone: string | null
          nfse_issue_to: string | null
          nfse_max_sessions_per_invoice: number | null
          nfse_number_of_invoices: number | null
          no_nfse: boolean | null
          observations: string | null
          organization_id: string | null
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
          use_alternate_nfse_contact: boolean | null
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          frequency: string
          guardian_cpf?: string | null
          guardian_cpf_2?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_name_2?: string | null
          guardian_phone_1?: string | null
          guardian_phone_2?: string | null
          hide_from_schedule?: boolean | null
          hide_second_session_from_schedule?: boolean | null
          id?: string
          include_minor_text?: boolean | null
          is_minor?: boolean | null
          lgpd_consent_date?: string | null
          monthly_price?: boolean | null
          name: string
          nfse_alternate_email?: string | null
          nfse_alternate_phone?: string | null
          nfse_issue_to?: string | null
          nfse_max_sessions_per_invoice?: number | null
          nfse_number_of_invoices?: number | null
          no_nfse?: boolean | null
          observations?: string | null
          organization_id?: string | null
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
          use_alternate_nfse_contact?: boolean | null
          user_id: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          frequency?: string
          guardian_cpf?: string | null
          guardian_cpf_2?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_name_2?: string | null
          guardian_phone_1?: string | null
          guardian_phone_2?: string | null
          hide_from_schedule?: boolean | null
          hide_second_session_from_schedule?: boolean | null
          id?: string
          include_minor_text?: boolean | null
          is_minor?: boolean | null
          lgpd_consent_date?: string | null
          monthly_price?: boolean | null
          name?: string
          nfse_alternate_email?: string | null
          nfse_alternate_phone?: string | null
          nfse_issue_to?: string | null
          nfse_max_sessions_per_invoice?: number | null
          nfse_number_of_invoices?: number | null
          no_nfse?: boolean | null
          observations?: string | null
          organization_id?: string | null
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
          use_alternate_nfse_contact?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          nfse_id: string
          organization_id: string | null
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          id?: string
          nfse_id: string
          organization_id?: string | null
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          nfse_id?: string
          organization_id?: string | null
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_nfse_id_fkey"
            columns: ["nfse_id"]
            isOneToOne: false
            referencedRelation: "nfse_issued"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "nfse_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      peer_sharing: {
        Row: {
          created_at: string
          id: string
          is_bidirectional: boolean
          receiver_user_id: string
          shared_domains: string[]
          sharer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_bidirectional?: boolean
          receiver_user_id: string
          shared_domains?: string[]
          sharer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_bidirectional?: boolean
          receiver_user_id?: string
          shared_domains?: string[]
          sharer_user_id?: string
          updated_at?: string
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
      professional_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_clinical: boolean
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_clinical?: boolean
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_clinical?: boolean
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          birth_date: string
          break_time: number | null
          clinical_approach: string | null
          clinical_approach_id: string | null
          cpf: string | null
          created_at: string
          created_by: string | null
          crp: string | null
          full_name: string
          id: string
          organization_id: string | null
          phone: string | null
          professional_role_id: string | null
          send_nfse_to_therapist: boolean | null
          slot_duration: number | null
          updated_at: string
          work_days: number[] | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          birth_date: string
          break_time?: number | null
          clinical_approach?: string | null
          clinical_approach_id?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          crp?: string | null
          full_name: string
          id: string
          organization_id?: string | null
          phone?: string | null
          professional_role_id?: string | null
          send_nfse_to_therapist?: boolean | null
          slot_duration?: number | null
          updated_at?: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          birth_date?: string
          break_time?: number | null
          clinical_approach?: string | null
          clinical_approach_id?: string | null
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          crp?: string | null
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string | null
          professional_role_id?: string | null
          send_nfse_to_therapist?: boolean | null
          slot_duration?: number | null
          updated_at?: string
          work_days?: number[] | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_clinical_approach_id_fkey"
            columns: ["clinical_approach_id"]
            isOneToOne: false
            referencedRelation: "clinical_approaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_professional_role_id_fkey"
            columns: ["professional_role_id"]
            isOneToOne: false
            referencedRelation: "professional_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          created_at: string
          day_of_week: number
          end_date: string | null
          end_time: string
          id: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
      session_evaluations: {
        Row: {
          attention_data: Json | null
          consciousness_data: Json | null
          created_at: string
          evaluated_by: string
          id: string
          intelligence_data: Json | null
          language_data: Json | null
          memory_data: Json | null
          mood_data: Json | null
          organization_id: string | null
          orientation_data: Json | null
          patient_id: string
          personality_data: Json | null
          psychomotor_data: Json | null
          sensoperception_data: Json | null
          session_id: string
          thought_data: Json | null
          updated_at: string
          will_data: Json | null
        }
        Insert: {
          attention_data?: Json | null
          consciousness_data?: Json | null
          created_at?: string
          evaluated_by: string
          id?: string
          intelligence_data?: Json | null
          language_data?: Json | null
          memory_data?: Json | null
          mood_data?: Json | null
          organization_id?: string | null
          orientation_data?: Json | null
          patient_id: string
          personality_data?: Json | null
          psychomotor_data?: Json | null
          sensoperception_data?: Json | null
          session_id: string
          thought_data?: Json | null
          updated_at?: string
          will_data?: Json | null
        }
        Update: {
          attention_data?: Json | null
          consciousness_data?: Json | null
          created_at?: string
          evaluated_by?: string
          id?: string
          intelligence_data?: Json | null
          language_data?: Json | null
          memory_data?: Json | null
          mood_data?: Json | null
          organization_id?: string | null
          orientation_data?: Json | null
          patient_id?: string
          personality_data?: Json | null
          psychomotor_data?: Json | null
          sensoperception_data?: Json | null
          session_id?: string
          thought_data?: Json | null
          updated_at?: string
          will_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "session_evaluations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_evaluations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_history: {
        Row: {
          changed_at: string
          id: string
          new_day: string
          new_time: string
          old_day: string
          old_time: string
          organization_id: string | null
          patient_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_day: string
          new_time: string
          old_day: string
          old_time: string
          organization_id?: string | null
          patient_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_day?: string
          new_time?: string
          old_day?: string
          old_time?: string
          organization_id?: string | null
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
          manually_marked_nfse: boolean | null
          nfse_issued_id: string | null
          notes: string | null
          organization_id: string | null
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
          manually_marked_nfse?: boolean | null
          nfse_issued_id?: string | null
          notes?: string | null
          organization_id?: string | null
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
          manually_marked_nfse?: boolean | null
          nfse_issued_id?: string | null
          notes?: string | null
          organization_id?: string | null
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
            foreignKeyName: "sessions_nfse_issued_id_fkey"
            columns: ["nfse_issued_id"]
            isOneToOne: false
            referencedRelation: "nfse_issued"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      subordinate_autonomy_settings: {
        Row: {
          created_at: string
          has_financial_access: boolean
          id: string
          manager_id: string
          manages_own_patients: boolean
          nfse_emission_mode: string | null
          organization_id: string | null
          subordinate_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          has_financial_access?: boolean
          id?: string
          manager_id: string
          manages_own_patients?: boolean
          nfse_emission_mode?: string | null
          organization_id?: string | null
          subordinate_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          has_financial_access?: boolean
          id?: string
          manager_id?: string
          manages_own_patients?: boolean
          nfse_emission_mode?: string | null
          organization_id?: string | null
          subordinate_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subordinate_autonomy_settings_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subordinate_autonomy_settings_subordinate_id_fkey"
            columns: ["subordinate_id"]
            isOneToOne: true
            referencedRelation: "profiles"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          read?: boolean
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      therapist_assignments: {
        Row: {
          created_at: string | null
          id: string
          manager_id: string
          subordinate_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          manager_id: string
          subordinate_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          manager_id?: string
          subordinate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "therapist_assignments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "therapist_assignments_subordinate_id_fkey"
            columns: ["subordinate_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      therapist_notifications: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          message: string
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          read?: boolean
          therapist_id?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      user_layout_preferences: {
        Row: {
          created_at: string
          id: string
          layout_config: Json
          layout_type: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          layout_config?: Json
          layout_type: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          id?: string
          layout_config?: Json
          layout_type?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      user_layout_templates: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          layout_snapshot: Json
          template_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_snapshot: Json
          template_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          layout_snapshot?: Json
          template_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_positions: {
        Row: {
          access_expires_at: string | null
          created_at: string
          id: string
          position_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          created_at?: string
          id?: string
          position_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          created_at?: string
          id?: string
          position_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "organization_positions"
            referencedColumns: ["id"]
          },
        ]
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
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          created_at: string
          id: string
          last_message_at: string
          last_message_from: string
          organization_id: string | null
          patient_id: string | null
          phone_number: string
          status: string
          unread_count: number
          updated_at: string
          user_id: string
          window_expires_at: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_from: string
          organization_id?: string | null
          patient_id?: string | null
          phone_number: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id: string
          window_expires_at?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_from?: string
          organization_id?: string | null
          patient_id?: string | null
          phone_number?: string
          status?: string
          unread_count?: number
          updated_at?: string
          user_id?: string
          window_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          media_url: string | null
          message_type: string
          metadata: Json | null
          organization_id: string | null
          status: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          media_url?: string | null
          message_type: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          organization_id?: string | null
          status?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_peer_data: {
        Args: {
          _domain: string
          _requesting_user_id: string
          _target_user_id: string
        }
        Returns: boolean
      }
      check_expired_temporary_access: { Args: never; Returns: undefined }
      current_user_organization: { Args: never; Returns: string }
      get_all_subordinates: {
        Args: { _user_id: string }
        Returns: {
          depth: number
          subordinate_user_id: string
        }[]
      }
      get_all_superiors: {
        Args: { _user_id: string }
        Returns: {
          depth: number
          superior_user_id: string
        }[]
      }
      get_direct_superior: { Args: { _user_id: string }; Returns: string }
      get_level_organization_id: {
        Args: { _level_id: string }
        Returns: string
      }
      get_manager_id: { Args: { _subordinate_id: string }; Returns: string }
      get_organization_hierarchy_info: {
        Args: { _user_id: string }
        Returns: {
          depth_from_top: number
          direct_superior_user_id: string
          is_owner: boolean
          level_id: string
          level_name: string
          level_number: number
          organization_id: string
          parent_position_id: string
          position_id: string
          position_name: string
          user_id: string
        }[]
      }
      get_organization_id_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      get_peer_shared_domains: {
        Args: { _requesting_user_id: string; _target_user_id: string }
        Returns: string[]
      }
      get_subordinate_ids: { Args: { _manager_id: string }; Returns: string[] }
      get_subordinate_therapists: {
        Args: { _manager_id: string }
        Returns: {
          subordinate_id: string
        }[]
      }
      get_subordinates_at_depth: {
        Args: { _target_depth?: number; _user_id: string }
        Returns: {
          subordinate_user_id: string
        }[]
      }
      get_user_level_number: { Args: { _user_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_in_hierarchy_below: {
        Args: { _superior_user_id: string; _user_id: string }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _manager_id: string; _subordinate_id: string }
        Returns: boolean
      }
      is_organization_owner: { Args: { _user_id: string }; Returns: boolean }
      is_subordinate: { Args: { _user_id: string }; Returns: boolean }
      resolve_organization_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      validate_cpf: { Args: { cpf_input: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "therapist"
        | "accountant"
        | "fulltherapist"
        | "psychologist"
        | "assistant"
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
      app_role: [
        "admin",
        "therapist",
        "accountant",
        "fulltherapist",
        "psychologist",
        "assistant",
      ],
    },
  },
} as const
