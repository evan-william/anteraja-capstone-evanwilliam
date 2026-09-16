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
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type TransactionRow = Database['public']['Tables']['transactions']['Row'];
export type UserRow = Database['public']['Tables']['users']['Row'];
