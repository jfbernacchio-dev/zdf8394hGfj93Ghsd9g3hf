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
          specifier_type: string
          specifier_value: string
        }
        Insert: {
          complaint_id: string
          created_at?: string | null
          id?: string
          specifier_type: string
          specifier_value: string
        }
        Update: {
          complaint_id?: string
          created_at?: string | null
          id?: string
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
      nfse_payments: {
        Row: {
          amount: number
          created_at: string
          has_proof: boolean
          id: string
          notes: string | null
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
          guardian_cpf_2: string | null
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
          payment_id: string
        }
        Insert: {
          allocated_amount: number
          created_at?: string
          id?: string
          nfse_id: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          nfse_id?: string
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
