export type CategoryType = 'expense' | 'income';

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
          delivery_status: 'created' | 'picked_up' | 'in_transit' | 'delivered' | 'returned' | 'cancelled';
          recipient_name: string | null; delivered_at: string | null;
          created_at: string; updated_at: string;
        };
        Insert: { id?: string; user_id: string; tracking_number: string; service_type?: string; delivery_status?: string; recipient_name?: string | null; delivered_at?: string | null };
        Update: { service_type?: string; delivery_status?: string; recipient_name?: string | null; delivered_at?: string | null };
        Relationships: [];
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
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type UserRow = Database['public']['Tables']['users']['Row'];
