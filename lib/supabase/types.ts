export type CategoryType = 'expense' | 'income';
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string;
          name?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: CategoryType;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: CategoryType;
          is_archived?: boolean;
        };
        Update: {
          name?: string;
          type?: CategoryType;
          is_archived?: boolean;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          description: string | null;
          transaction_date: string;
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          description?: string | null;
          transaction_date: string;
          is_deleted?: boolean;
        };
        Update: {
          category_id?: string;
          amount?: number;
          description?: string | null;
          transaction_date?: string;
          is_deleted?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'transactions_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
      bank_imports: {
        Row: {
          id: string;
          user_id: string;
          file_name: string;
          bank: 'bank_a' | 'bank_b';
          new_count: number;
          matched_count: number;
          error_count: number;
          status: 'completed' | 'cancelled';
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          bank: 'bank_a' | 'bank_b';
        };
        Update: {
          status?: 'completed' | 'cancelled';
          cancelled_at?: string | null;
        };
        Relationships: [];
      };
      category_rules: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          keyword: string;
          type: CategoryType;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          keyword: string;
          type: CategoryType;
        };
        Update: { category_id?: string; keyword?: string; type?: CategoryType };
        Relationships: [];
      };
      bank_import_rows: {
        Row: {
          id: string;
          import_id: string;
          user_id: string;
          row_number: number;
          fingerprint: string;
          transaction_date: string | null;
          description: string | null;
          amount: number | null;
          type: CategoryType | null;
          status: 'new' | 'matched' | 'error';
          category_id: string | null;
          matched_transaction_id: string | null;
          created_transaction_id: string | null;
          error_message: string | null;
          settlement_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string; user_id: string; tracking_number: string;
          service_type: 'regular' | 'next_day' | 'same_day' | 'economy' | 'cargo';
          delivery_status: 'created' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'failed_delivery' | 'delivered' | 'returned' | 'cancelled';
          recipient_name: string | null; delivered_at: string | null;
          sender_name: string | null; recipient_phone: string | null;
          origin_city: string | null; destination_city: string | null;
          destination_district: string | null; destination_street: string | null;
          destination_landmark: string | null; estimated_delivery_at: string | null;
          last_scan_at: string | null; risk_status: 'on_track' | 'at_risk' | 'action_required' | 'resolved';
          exception_code: string | null; exception_reason: string | null;
          current_location: string | null; current_lat: number | null; current_lng: number | null;
          access_code_hash: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { id?: string; user_id: string; tracking_number: string; service_type?: string; delivery_status?: string; recipient_name?: string | null; delivered_at?: string | null; sender_name?: string | null; recipient_phone?: string | null; origin_city?: string | null; destination_city?: string | null; destination_district?: string | null; destination_street?: string | null; destination_landmark?: string | null; estimated_delivery_at?: string | null; last_scan_at?: string | null; risk_status?: string; exception_code?: string | null; exception_reason?: string | null; current_location?: string | null; current_lat?: number | null; current_lng?: number | null; access_code_hash?: string | null };
        Update: { service_type?: string; delivery_status?: string; recipient_name?: string | null; delivered_at?: string | null; sender_name?: string | null; recipient_phone?: string | null; origin_city?: string | null; destination_city?: string | null; destination_district?: string | null; destination_street?: string | null; destination_landmark?: string | null; estimated_delivery_at?: string | null; last_scan_at?: string | null; risk_status?: string; exception_code?: string | null; exception_reason?: string | null; current_location?: string | null; current_lat?: number | null; current_lng?: number | null; access_code_hash?: string | null };
        Relationships: [];
      };
      shipment_events: {
        Row: { id: string; user_id: string; shipment_id: string; event_code: string; status_label: string; description: string; location: string | null; latitude: number | null; longitude: number | null; occurred_at: string; created_at: string };
        Insert: { id?: string; user_id: string; shipment_id: string; event_code: string; status_label: string; description: string; location?: string | null; latitude?: number | null; longitude?: number | null; occurred_at: string };
        Update: never;
        Relationships: [];
      };
      shipment_resolutions: {
        Row: { id: string; user_id: string; shipment_id: string; resolution_type: 'update_address' | 'reschedule' | 'safe_drop'; payload: Json; status: 'pending_sync' | 'synced' | 'failed' | 'cancelled'; submitted_at: string; synced_at: string | null };
        Insert: never; Update: never; Relationships: [];
      };
      support_tickets: {
        Row: { id: string; user_id: string; shipment_id: string; ticket_number: string; customer_note: string | null; context_snapshot: Json; status: 'open' | 'in_progress' | 'resolved' | 'closed'; response_due_at: string; created_at: string; updated_at: string };
        Insert: never; Update: { status?: 'open' | 'in_progress' | 'resolved' | 'closed' }; Relationships: [];
      };
      notification_preferences: {
        Row: { id: string; user_id: string; shipment_id: string; whatsapp_enabled: boolean; email_enabled: boolean; push_enabled: boolean; meaningful_changes_only: boolean; destination_masked: string | null; created_at: string; updated_at: string };
        Insert: never; Update: never; Relationships: [];
      };
      integration_outbox: {
        Row: { id: string; user_id: string; shipment_id: string | null; destination: string; event_type: string; payload: Json; status: 'pending' | 'processing' | 'sent' | 'failed'; attempts: number; available_at: string; processed_at: string | null; last_error: string | null; created_at: string };
        Insert: never; Update: never; Relationships: [];
      };
      tracking_rate_limits: {
        Row: { client_key: string; window_started_at: string; request_count: number };
        Insert: never; Update: never; Relationships: [];
      };
      settlements: {
        Row: {
          id: string; user_id: string; reference: string; settlement_date: string;
          status: 'draft' | 'paid' | 'reconciled' | 'disputed' | 'cancelled';
          gross_amount: number; fee_amount: number; return_amount: number; net_amount: number;
          reconciled_at: string | null; created_at: string; updated_at: string;
        };
        Insert: { id?: string; user_id: string; reference: string; settlement_date: string; status?: string };
        Update: { reference?: string; settlement_date?: string; status?: string; reconciled_at?: string | null };
        Relationships: [];
      };
      settlement_items: {
        Row: {
          id: string; user_id: string; settlement_id: string; shipment_id: string;
          cod_amount: number; shipping_fee: number; service_fee: number; return_amount: number;
          net_amount: number; created_at: string; updated_at: string;
        };
        Insert: { id?: string; user_id: string; settlement_id: string; shipment_id: string; cod_amount?: number; shipping_fee?: number; service_fee?: number; return_amount?: number };
        Update: { cod_amount?: number; shipping_fee?: number; service_fee?: number; return_amount?: number };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      save_bank_import: {
        Args: { p_file_name: string; p_bank: string; p_rows: unknown; p_rules?: unknown };
        Returns: string;
      };
      cancel_bank_import: {
        Args: { p_import_id: string };
        Returns: {
          import_id: string;
          cancelled_transactions: number;
          already_cancelled: boolean;
        };
      };
      link_bank_row_to_settlement: {
        Args: { p_import_row_id: string; p_settlement_id: string };
        Returns: { import_row_id: string; settlement_id: string; net_amount: number; status: 'reconciled' };
      };
      consume_tracking_rate_limit: { Args: { p_client_key: string }; Returns: boolean };
      get_public_tracking: { Args: { p_awb: string; p_access_code: string }; Returns: Json };
      submit_tracking_resolution: { Args: { p_awb: string; p_access_code: string; p_resolution_type: string; p_payload: Json }; Returns: Json };
      create_tracking_ticket: { Args: { p_awb: string; p_access_code: string; p_note: string }; Returns: Json };
      set_tracking_notifications: { Args: { p_awb: string; p_access_code: string; p_whatsapp: boolean; p_email: boolean; p_push: boolean }; Returns: Json };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type UserRow = Database['public']['Tables']['users']['Row'];
