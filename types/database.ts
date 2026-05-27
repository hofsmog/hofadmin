export type OrganizationRole = "owner" | "admin" | "member";
export type QrItemType = "general" | "event" | "member" | "asset" | "location";
export type ActivityEventType =
  | "qr_created"
  | "checkin_created"
  | "member_invited"
  | "organization_updated"
  | "module_opened"
  | "module_enabled";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          display_name: string | null;
          slug: string;
          avatar_url: string | null;
          logo_url: string | null;
          accent_color: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          display_name?: string | null;
          slug: string;
          avatar_url?: string | null;
          logo_url?: string | null;
          accent_color?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          display_name?: string | null;
          slug?: string;
          avatar_url?: string | null;
          logo_url?: string | null;
          accent_color?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          organization_id: string;
          user_id: string;
          role: OrganizationRole;
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role?: OrganizationRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role?: OrganizationRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: OrganizationRole;
          invited_by: string;
          status: "pending" | "accepted" | "revoked";
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: OrganizationRole;
          invited_by: string;
          status?: "pending" | "accepted" | "revoked";
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: OrganizationRole;
          invited_by?: string;
          status?: "pending" | "accepted" | "revoked";
          created_at?: string;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      qr_items: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          type: QrItemType;
          description: string | null;
          qr_value: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          type?: QrItemType;
          description?: string | null;
          qr_value: string;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          type?: QrItemType;
          description?: string | null;
          qr_value?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "qr_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      checkins: {
        Row: {
          id: string;
          organization_id: string;
          qr_item_id: string | null;
          checkin_value: string;
          attendee_name: string | null;
          notes: string | null;
          checked_in_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          qr_item_id?: string | null;
          checkin_value: string;
          attendee_name?: string | null;
          notes?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          qr_item_id?: string | null;
          checkin_value?: string;
          attendee_name?: string | null;
          notes?: string | null;
          checked_in_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "checkins_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "checkins_qr_item_id_fkey";
            columns: ["qr_item_id"];
            isOneToOne: false;
            referencedRelation: "qr_items";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_events: {
        Row: {
          id: string;
          organization_id: string;
          type: ActivityEventType;
          title: string;
          description: string | null;
          metadata: Json;
          actor_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          type: ActivityEventType;
          title: string;
          description?: string | null;
          metadata?: Json;
          actor_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          type?: ActivityEventType;
          title?: string;
          description?: string | null;
          metadata?: Json;
          actor_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_organization_with_owner: {
        Args: {
          org_name: string;
          org_slug: string;
          org_avatar_url?: string | null;
        };
        Returns: Database["public"]["Tables"]["organizations"]["Row"];
      };
    };
    Enums: {
      organization_role: OrganizationRole;
      invitation_status: "pending" | "accepted" | "revoked";
      qr_item_type: QrItemType;
      activity_event_type: ActivityEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
