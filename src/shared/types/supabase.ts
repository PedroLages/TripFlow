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
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_date: string
          activity_time: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          activity_date: string
          activity_time?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          activity_date?: string
          activity_time?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          id: string
          timestamp: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          action: string
          id?: string
          timestamp?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          action?: string
          id?: string
          timestamp?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      day_plans: {
        Row: {
          created_at: string | null
          date: string
          id: string
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "day_plans_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      email_connections: {
        Row: {
          access_token: string | null
          connection_status: string | null
          created_at: string | null
          email_address: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: string | null
          refresh_token: string | null
          sync_enabled: boolean | null
          token_expires_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          email_address: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          connection_status?: string | null
          created_at?: string | null
          email_address?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string | null
          refresh_token?: string | null
          sync_enabled?: boolean | null
          token_expires_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      expense_splits: {
        Row: {
          amount: number
          amount_paid: number | null
          created_at: string | null
          expense_id: string
          id: string
          is_paid: boolean | null
          paid_at: string | null
          percentage: number | null
          shares: number | null
          user_id: string
        }
        Insert: {
          amount: number
          amount_paid?: number | null
          created_at?: string | null
          expense_id: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          shares?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          amount_paid?: number | null
          created_at?: string | null
          expense_id?: string
          id?: string
          is_paid?: boolean | null
          paid_at?: string | null
          percentage?: number | null
          shares?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          created_by: string
          currency: string | null
          date: string
          id: string
          is_split: boolean | null
          notes: string | null
          paid_by: string | null
          split_method: string | null
          trip_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          created_by: string
          currency?: string | null
          date: string
          id?: string
          is_split?: boolean | null
          notes?: string | null
          paid_by?: string | null
          split_method?: string | null
          trip_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          created_by?: string
          currency?: string | null
          date?: string
          id?: string
          is_split?: boolean | null
          notes?: string | null
          paid_by?: string | null
          split_method?: string | null
          trip_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_feedback: {
        Row: {
          actual_trip_id: string | null
          confidence: number | null
          corrected_at: string | null
          corrected_by: string | null
          id: string
          parsed_email_id: string | null
          suggested_trip_id: string | null
        }
        Insert: {
          actual_trip_id?: string | null
          confidence?: number | null
          corrected_at?: string | null
          corrected_by?: string | null
          id?: string
          parsed_email_id?: string | null
          suggested_trip_id?: string | null
        }
        Update: {
          actual_trip_id?: string | null
          confidence?: number | null
          corrected_at?: string | null
          corrected_by?: string | null
          id?: string
          parsed_email_id?: string | null
          suggested_trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matching_feedback_actual_trip_id_fkey"
            columns: ["actual_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_feedback_parsed_email_id_fkey"
            columns: ["parsed_email_id"]
            isOneToOne: false
            referencedRelation: "parsed_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matching_feedback_suggested_trip_id_fkey"
            columns: ["suggested_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      packing_items: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_packed: boolean | null
          name: string
          trip_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_packed?: boolean | null
          name: string
          trip_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_packed?: boolean | null
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      parsed_emails: {
        Row: {
          attachments: Json | null
          connection_id: string
          created_at: string | null
          detected_type: string | null
          document_id: string | null
          duplicate_of: string | null
          email_body_html: string | null
          email_body_text: string | null
          email_date: string | null
          email_from: string | null
          email_id: string
          email_subject: string | null
          id: string
          is_duplicate: boolean | null
          match_action: string | null
          match_candidates: Json | null
          match_confidence: number | null
          matched_at: string | null
          parsed_at: string | null
          parsed_data: Json | null
          parsing_confidence: number | null
          parsing_error: string | null
          parsing_status: string | null
          trip_id: string | null
          updated_at: string | null
          user_action: string | null
          user_reviewed: boolean | null
        }
        Insert: {
          attachments?: Json | null
          connection_id: string
          created_at?: string | null
          detected_type?: string | null
          document_id?: string | null
          duplicate_of?: string | null
          email_body_html?: string | null
          email_body_text?: string | null
          email_date?: string | null
          email_from?: string | null
          email_id: string
          email_subject?: string | null
          id?: string
          is_duplicate?: boolean | null
          match_action?: string | null
          match_candidates?: Json | null
          match_confidence?: number | null
          matched_at?: string | null
          parsed_at?: string | null
          parsed_data?: Json | null
          parsing_confidence?: number | null
          parsing_error?: string | null
          parsing_status?: string | null
          trip_id?: string | null
          updated_at?: string | null
          user_action?: string | null
          user_reviewed?: boolean | null
        }
        Update: {
          attachments?: Json | null
          connection_id?: string
          created_at?: string | null
          detected_type?: string | null
          document_id?: string | null
          duplicate_of?: string | null
          email_body_html?: string | null
          email_body_text?: string | null
          email_date?: string | null
          email_from?: string | null
          email_id?: string
          email_subject?: string | null
          id?: string
          is_duplicate?: boolean | null
          match_action?: string | null
          match_candidates?: Json | null
          match_confidence?: number | null
          matched_at?: string | null
          parsed_at?: string | null
          parsed_data?: Json | null
          parsing_confidence?: number | null
          parsing_error?: string | null
          parsing_status?: string | null
          trip_id?: string | null
          updated_at?: string | null
          user_action?: string | null
          user_reviewed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "parsed_emails_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "email_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_emails_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "travel_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_emails_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "parsed_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parsed_emails_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          expense_split_id: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string | null
        }
        Insert: {
          amount: number
          expense_split_id: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
        }
        Update: {
          amount?: number
          expense_split_id?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_expense_split_id_fkey"
            columns: ["expense_split_id"]
            isOneToOne: false
            referencedRelation: "expense_splits"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          home_location: string | null
          id: string
          preferred_currency: string | null
          sidebar_collapsed: boolean | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          home_location?: string | null
          id: string
          preferred_currency?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          home_location?: string | null
          id?: string
          preferred_currency?: string | null
          sidebar_collapsed?: boolean | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      receipt_images: {
        Row: {
          expense_id: string
          filename: string
          id: string
          mime_type: string
          size_bytes: number | null
          storage_path: string
          thumbnail_path: string | null
          uploaded_at: string | null
        }
        Insert: {
          expense_id: string
          filename: string
          id?: string
          mime_type: string
          size_bytes?: number | null
          storage_path: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
        }
        Update: {
          expense_id?: string
          filename?: string
          id?: string
          mime_type?: string
          size_bytes?: number | null
          storage_path?: string
          thumbnail_path?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipt_images_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      settlements: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          from_user: string
          id: string
          notes: string | null
          status: string | null
          to_user: string
          trip_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_user: string
          id?: string
          notes?: string | null
          status?: string | null
          to_user: string
          trip_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          from_user?: string
          id?: string
          notes?: string | null
          status?: string | null
          to_user?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          date: string | null
          description: string | null
          id: string
          severity: string | null
          title: string
          trip_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          severity?: string | null
          title: string
          trip_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          date?: string | null
          description?: string | null
          id?: string
          severity?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_alerts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_documents: {
        Row: {
          confirmation: string | null
          created_at: string | null
          date: string | null
          details: string | null
          doc_type: string
          gate: string | null
          id: string
          last_updated: string | null
          price: number | null
          status: string | null
          title: string
          trip_id: string
        }
        Insert: {
          confirmation?: string | null
          created_at?: string | null
          date?: string | null
          details?: string | null
          doc_type: string
          gate?: string | null
          id?: string
          last_updated?: string | null
          price?: number | null
          status?: string | null
          title: string
          trip_id: string
        }
        Update: {
          confirmation?: string | null
          created_at?: string | null
          date?: string | null
          details?: string | null
          doc_type?: string
          gate?: string | null
          id?: string
          last_updated?: string | null
          price?: number | null
          status?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          declined_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          invitee_email: string
          role: string
          status: string
          trip_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          invitee_email: string
          role: string
          status?: string
          trip_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          declined_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          invitee_email?: string
          role?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_invitations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_members: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string | null
          trip_id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          trip_id: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          destinations: string[] | null
          end_date: string
          id: string
          metadata: Json | null
          name: string
          owner_id: string
          start_date: string
          status: string
          trip_type: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destinations?: string[] | null
          end_date: string
          id?: string
          metadata?: Json | null
          name: string
          owner_id: string
          start_date: string
          status?: string
          trip_type?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          destinations?: string[] | null
          end_date?: string
          id?: string
          metadata?: Json | null
          name?: string
          owner_id?: string
          start_date?: string
          status?: string
          trip_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_places: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          rating: number | null
          trip_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          rating?: number | null
          trip_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          rating?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_places_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_invitation_token: string }; Returns: Json }
      expire_old_invitations: { Args: never; Returns: undefined }
      get_invitation_details: {
        Args: { p_invitation_token: string }
        Returns: Json
      }
      get_member_trips: {
        Args: never
        Returns: {
          budget: number | null
          cover_image: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          destinations: string[] | null
          end_date: string
          id: string
          metadata: Json | null
          name: string
          owner_id: string
          start_date: string
          status: string
          trip_type: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "trips"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      is_trip_editor_helper: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      is_trip_member: { Args: { check_trip_id: string }; Returns: boolean }
      is_trip_member_helper: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      is_trip_owner: { Args: { check_trip_id: string }; Returns: boolean }
      user_can_edit_trip: { Args: { trip_uuid: string }; Returns: boolean }
      user_has_trip_access: { Args: { trip_uuid: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
