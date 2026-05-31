export type OrganizationRole = "owner" | "admin" | "member";
export type OrganizationSidebarStyle = "light" | "dark" | "system";
export type QrItemType = "general" | "event" | "member" | "asset" | "location";
export type OrganizationType = "school" | "club" | "business" | "restaurant" | "cafe" | "event" | "other";
export type MemberStatus = "active" | "inactive";
export type MemberType = "student" | "staff" | "player" | "volunteer" | "employee" | "customer" | "guest" | "other";
export type FormStatus = "draft" | "active" | "published" | "archived";
export type FormFieldType = "text" | "textarea" | "email" | "phone" | "number" | "date" | "select" | "checkbox";
export type FormFontStyle = "default" | "modern" | "classic" | "playful";
export type FormLayout = "card" | "full-width" | "minimal";
export type FormCornerRadius = "none" | "small" | "medium" | "large";
export type FormSubmissionReadStatus = "new" | "read";
export type FormSubmissionHandlingStatus = "unhandled" | "partially_handled" | "handled" | "archived";
export type InventoryItemStatus = "available" | "in_use" | "maintenance" | "lost" | "retired";
export type InventoryItemCondition = "new" | "good" | "fair" | "poor" | "broken";
export type InventoryEventType = "created" | "updated" | "assigned" | "returned" | "status_changed" | "location_changed" | "maintenance" | "retired" | "due_date_changed";
export type InventoryLoanStatus = "active" | "returned" | "overdue" | "cancelled";
export type ActivityEventType =
  | "qr_created"
  | "checkin_created"
  | "member_invited"
  | "member_created"
  | "form_created"
  | "form_submission_received"
  | "form_submission_read"
  | "form_submission_handling_changed"
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
          favicon_url: string | null;
          accent_color: string | null;
          background_color: string | null;
          sidebar_style: OrganizationSidebarStyle;
          public_branding_enabled: boolean;
          custom_welcome_message: string | null;
          support_email: string | null;
          website_url: string | null;
          organization_type: OrganizationType | null;
          starter_modules: string[];
          onboarding_checklist: Json;
          onboarding_completed_at: string | null;
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
          favicon_url?: string | null;
          accent_color?: string | null;
          background_color?: string | null;
          sidebar_style?: OrganizationSidebarStyle;
          public_branding_enabled?: boolean;
          custom_welcome_message?: string | null;
          support_email?: string | null;
          website_url?: string | null;
          organization_type?: OrganizationType | null;
          starter_modules?: string[];
          onboarding_checklist?: Json;
          onboarding_completed_at?: string | null;
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
          favicon_url?: string | null;
          accent_color?: string | null;
          background_color?: string | null;
          sidebar_style?: OrganizationSidebarStyle;
          public_branding_enabled?: boolean;
          custom_welcome_message?: string | null;
          support_email?: string | null;
          website_url?: string | null;
          organization_type?: OrganizationType | null;
          starter_modules?: string[];
          onboarding_checklist?: Json;
          onboarding_completed_at?: string | null;
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
      members: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          status: MemberStatus;
          type: MemberType;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          status?: MemberStatus;
          type?: MemberType;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          status?: MemberStatus;
          type?: MemberType;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      member_qr_links: {
        Row: {
          id: string;
          organization_id: string;
          member_id: string;
          qr_item_id: string | null;
          linked_by: string | null;
          linked_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          member_id: string;
          qr_item_id?: string | null;
          linked_by?: string | null;
          linked_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          member_id?: string;
          qr_item_id?: string | null;
          linked_by?: string | null;
          linked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_qr_links_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_qr_links_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_qr_links_qr_item_id_fkey";
            columns: ["qr_item_id"];
            isOneToOne: false;
            referencedRelation: "qr_items";
            referencedColumns: ["id"];
          },
        ];
      };
      forms: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string | null;
          status: FormStatus;
          slug: string;
          accent_color: string;
          background_color: string;
          text_color: string;
          button_color: string;
          button_text_color: string;
          font_style: FormFontStyle;
          form_layout: FormLayout;
          corner_radius: FormCornerRadius;
          logo_url: string | null;
          cover_image_url: string | null;
          custom_thank_you_message: string | null;
          submit_button_text: string;
          enable_email_notifications: boolean;
          notification_emails: string[];
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description?: string | null;
          status?: FormStatus;
          slug: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          button_color?: string;
          button_text_color?: string;
          font_style?: FormFontStyle;
          form_layout?: FormLayout;
          corner_radius?: FormCornerRadius;
          logo_url?: string | null;
          cover_image_url?: string | null;
          custom_thank_you_message?: string | null;
          submit_button_text?: string;
          enable_email_notifications?: boolean;
          notification_emails?: string[];
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string | null;
          status?: FormStatus;
          slug?: string;
          accent_color?: string;
          background_color?: string;
          text_color?: string;
          button_color?: string;
          button_text_color?: string;
          font_style?: FormFontStyle;
          form_layout?: FormLayout;
          corner_radius?: FormCornerRadius;
          logo_url?: string | null;
          cover_image_url?: string | null;
          custom_thank_you_message?: string | null;
          submit_button_text?: string;
          enable_email_notifications?: boolean;
          notification_emails?: string[];
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forms_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      form_fields: {
        Row: {
          id: string;
          organization_id: string;
          form_id: string;
          label: string;
          field_type: FormFieldType;
          is_required: boolean;
          options: Json;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          form_id: string;
          label: string;
          field_type: FormFieldType;
          is_required?: boolean;
          options?: Json;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          form_id?: string;
          label?: string;
          field_type?: FormFieldType;
          is_required?: boolean;
          options?: Json;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_fields_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_fields_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
        ];
      };
      form_submissions: {
        Row: {
          id: string;
          organization_id: string;
          form_id: string;
          submitted_by: string | null;
          submitter_email: string | null;
          read_status: FormSubmissionReadStatus;
          handling_status: FormSubmissionHandlingStatus;
          handled_note: string | null;
          handled_by: string | null;
          handled_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          form_id: string;
          submitted_by?: string | null;
          submitter_email?: string | null;
          read_status?: FormSubmissionReadStatus;
          handling_status?: FormSubmissionHandlingStatus;
          handled_note?: string | null;
          handled_by?: string | null;
          handled_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          form_id?: string;
          submitted_by?: string | null;
          submitter_email?: string | null;
          read_status?: FormSubmissionReadStatus;
          handling_status?: FormSubmissionHandlingStatus;
          handled_note?: string | null;
          handled_by?: string | null;
          handled_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_submissions_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey";
            columns: ["form_id"];
            isOneToOne: false;
            referencedRelation: "forms";
            referencedColumns: ["id"];
          },
        ];
      };
      form_submission_values: {
        Row: {
          id: string;
          organization_id: string;
          submission_id: string;
          field_id: string | null;
          field_label: string;
          value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          submission_id: string;
          field_id?: string | null;
          field_label: string;
          value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          submission_id?: string;
          field_id?: string | null;
          field_label?: string;
          value?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_submission_values_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submission_values_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "form_submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "form_submission_values_field_id_fkey";
            columns: ["field_id"];
            isOneToOne: false;
            referencedRelation: "form_fields";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_categories: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_categories_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          asset_tag: string | null;
          serial_number: string | null;
          status: InventoryItemStatus;
          condition: InventoryItemCondition;
          location: string | null;
            assigned_to_member_id: string | null;
            loan_due_date: string | null;
            loan_note: string | null;
            last_assigned_at: string | null;
            last_returned_at: string | null;
            qr_value: string | null;
          purchase_date: string | null;
          purchase_price: number | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          asset_tag?: string | null;
          serial_number?: string | null;
          status?: InventoryItemStatus;
          condition?: InventoryItemCondition;
          location?: string | null;
            assigned_to_member_id?: string | null;
            loan_due_date?: string | null;
            loan_note?: string | null;
            last_assigned_at?: string | null;
            last_returned_at?: string | null;
            qr_value?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          asset_tag?: string | null;
          serial_number?: string | null;
          status?: InventoryItemStatus;
          condition?: InventoryItemCondition;
          location?: string | null;
            assigned_to_member_id?: string | null;
            loan_due_date?: string | null;
            loan_note?: string | null;
            last_assigned_at?: string | null;
            last_returned_at?: string | null;
            qr_value?: string | null;
          purchase_date?: string | null;
          purchase_price?: number | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "inventory_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_events: {
        Row: {
          id: string;
          organization_id: string;
          inventory_item_id: string;
          event_type: InventoryEventType;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          inventory_item_id: string;
          event_type: InventoryEventType;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          inventory_item_id?: string;
          event_type?: InventoryEventType;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_events_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_events_inventory_item_id_fkey";
            columns: ["inventory_item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
        };
      inventory_loans: {
          Row: {
            id: string;
            organization_id: string;
            inventory_item_id: string;
            member_id: string;
            loaned_by: string;
            loaned_at: string;
            due_date: string | null;
            returned_at: string | null;
            status: InventoryLoanStatus;
            loan_note: string | null;
            agreement_text: string;
            borrower_name: string;
            borrower_email: string | null;
            borrower_phone: string | null;
            signature_data_url: string;
            signed_at: string;
            created_at: string;
            updated_at: string;
          };
          Insert: {
            id?: string;
            organization_id: string;
            inventory_item_id: string;
            member_id: string;
            loaned_by: string;
            loaned_at?: string;
            due_date?: string | null;
            returned_at?: string | null;
            status?: InventoryLoanStatus;
            loan_note?: string | null;
            agreement_text: string;
            borrower_name: string;
            borrower_email?: string | null;
            borrower_phone?: string | null;
            signature_data_url: string;
            signed_at?: string;
            created_at?: string;
            updated_at?: string;
          };
          Update: {
            id?: string;
            organization_id?: string;
            inventory_item_id?: string;
            member_id?: string;
            loaned_by?: string;
            loaned_at?: string;
            due_date?: string | null;
            returned_at?: string | null;
            status?: InventoryLoanStatus;
            loan_note?: string | null;
            agreement_text?: string;
            borrower_name?: string;
            borrower_email?: string | null;
            borrower_phone?: string | null;
            signature_data_url?: string;
            signed_at?: string;
            created_at?: string;
            updated_at?: string;
          };
          Relationships: [
            {
              foreignKeyName: "inventory_loans_organization_id_fkey";
              columns: ["organization_id"];
              isOneToOne: false;
              referencedRelation: "organizations";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "inventory_loans_inventory_item_id_fkey";
              columns: ["inventory_item_id"];
              isOneToOne: false;
              referencedRelation: "inventory_items";
              referencedColumns: ["id"];
            },
            {
              foreignKeyName: "inventory_loans_member_id_fkey";
              columns: ["member_id"];
              isOneToOne: false;
              referencedRelation: "members";
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
      organization_sidebar_style: OrganizationSidebarStyle;
      invitation_status: "pending" | "accepted" | "revoked";
      qr_item_type: QrItemType;
      activity_event_type: ActivityEventType;
      organization_type: OrganizationType;
      member_status: MemberStatus;
      member_type: MemberType;
      form_status: FormStatus;
      form_field_type: FormFieldType;
      inventory_item_status: InventoryItemStatus;
        inventory_item_condition: InventoryItemCondition;
        inventory_event_type: InventoryEventType;
        inventory_loan_status: InventoryLoanStatus;
      };
    CompositeTypes: Record<string, never>;
  };
};
