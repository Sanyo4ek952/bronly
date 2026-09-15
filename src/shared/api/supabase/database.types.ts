// Generated from the linked Supabase PostgREST schema. Do not edit by hand.
// Regenerate with: npm run supabase:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      agent_property_links: {
        Row: {
        id: string
        property_id: string
        owner_id: string
        agent_id: string
        status: Database["public"]["Enums"]["agent_link_status"]
        proposal_message: string | null
        collaboration_terms: string | null
        owner_contact_visible: boolean
        proposed_at: string
        decided_at: string | null
        created_at: string
      }
        Insert: {
        id?: string
        property_id: string
        owner_id: string
        agent_id: string
        status?: Database["public"]["Enums"]["agent_link_status"]
        proposal_message?: string | null
        collaboration_terms?: string | null
        owner_contact_visible?: boolean
        proposed_at?: string
        decided_at?: string | null
        created_at?: string
      }
        Update: {
        id?: string
        property_id?: string
        owner_id?: string
        agent_id?: string
        status?: Database["public"]["Enums"]["agent_link_status"]
        proposal_message?: string | null
        collaboration_terms?: string | null
        owner_contact_visible?: boolean
        proposed_at?: string
        decided_at?: string | null
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "agent_property_links_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "agent_property_links_owner_id_fkey"
          columns: ["owner_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "agent_property_links_agent_id_fkey"
          columns: ["agent_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      agent_room_links: {
        Row: {
        id: string
        room_id: string
        owner_id: string
        agent_id: string
        status: Database["public"]["Enums"]["agent_link_status"]
        proposal_message: string | null
        collaboration_terms: string | null
        owner_contact_visible: boolean
        proposed_at: string
        decided_at: string | null
        created_at: string
      }
        Insert: {
        id?: string
        room_id: string
        owner_id: string
        agent_id: string
        status?: Database["public"]["Enums"]["agent_link_status"]
        proposal_message?: string | null
        collaboration_terms?: string | null
        owner_contact_visible?: boolean
        proposed_at?: string
        decided_at?: string | null
        created_at?: string
      }
        Update: {
        id?: string
        room_id?: string
        owner_id?: string
        agent_id?: string
        status?: Database["public"]["Enums"]["agent_link_status"]
        proposal_message?: string | null
        collaboration_terms?: string | null
        owner_contact_visible?: boolean
        proposed_at?: string
        decided_at?: string | null
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "agent_room_links_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "agent_room_links_owner_id_fkey"
          columns: ["owner_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "agent_room_links_agent_id_fkey"
          columns: ["agent_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      collection_items: {
        Row: {
        id: string
        collection_id: string
        property_id: string | null
        room_id: string | null
        sort_order: number
        created_at: string
      }
        Insert: {
        id?: string
        collection_id: string
        property_id?: string | null
        room_id?: string | null
        sort_order?: number
        created_at?: string
      }
        Update: {
        id?: string
        collection_id?: string
        property_id?: string | null
        room_id?: string | null
        sort_order?: number
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "collection_items_collection_id_fkey"
          columns: ["collection_id"]
          isOneToOne: false
          referencedRelation: "collections"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "collection_items_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "collection_items_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        }
      ]
      }
      collection_events: {
        Row: {
        id: string
        collection_id: string
        event_type: string
        visitor_key: string
        created_at: string
      }
        Insert: {
        id?: string
        collection_id: string
        event_type?: string
        visitor_key: string
        created_at?: string
      }
        Update: {
        id?: string
        collection_id?: string
        event_type?: string
        visitor_key?: string
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "collection_events_collection_id_fkey"
          columns: ["collection_id"]
          isOneToOne: false
          referencedRelation: "collections"
          referencedColumns: ["id"]
        }
      ]
      }
      collections: {
        Row: {
        id: string
        creator_id: string
        creator_role: Database["public"]["Enums"]["app_role"]
        slug: string
        title: string
        guest_label: string | null
        is_archived: boolean
        views_count: number
        first_opened_at: string | null
        last_opened_at: string | null
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        creator_id: string
        creator_role: Database["public"]["Enums"]["app_role"]
        slug: string
        title: string
        guest_label?: string | null
        is_archived?: boolean
        views_count?: number
        first_opened_at?: string | null
        last_opened_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        creator_id?: string
        creator_role?: Database["public"]["Enums"]["app_role"]
        slug?: string
        title?: string
        guest_label?: string | null
        is_archived?: boolean
        views_count?: number
        first_opened_at?: string | null
        last_opened_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "collections_creator_id_fkey"
          columns: ["creator_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      guest_requests: {
        Row: {
        id: string
        source: Database["public"]["Enums"]["request_source"]
        property_id: string | null
        room_id: string
        owner_id: string
        agent_id: string | null
        collection_id: string | null
        guest_name: string
        guest_phone: string
        guest_email: string | null
        guest_comment: string | null
        adults_count: number
        children_count: number
        check_in: string
        check_out: string
        status: Database["public"]["Enums"]["request_status"]
        transferred_to_owner_at: string | null
        owner_confirmed_at: string | null
        completed_at: string | null
        base_price_per_night: number | null
        agent_markup_percent: number | null
        total_price: number | null
        pricing_snapshot: Json
        created_at: string
        updated_at: string
        completion_requested_at: string | null
        rooms_count: number
      }
        Insert: {
        id?: string
        source?: Database["public"]["Enums"]["request_source"]
        property_id?: string | null
        room_id: string
        owner_id: string
        agent_id?: string | null
        collection_id?: string | null
        guest_name: string
        guest_phone: string
        guest_email?: string | null
        guest_comment?: string | null
        adults_count?: number
        children_count?: number
        check_in: string
        check_out: string
        status?: Database["public"]["Enums"]["request_status"]
        transferred_to_owner_at?: string | null
        owner_confirmed_at?: string | null
        completed_at?: string | null
        base_price_per_night?: number | null
        agent_markup_percent?: number | null
        total_price?: number | null
        pricing_snapshot: Json
        created_at?: string
        updated_at?: string
        completion_requested_at?: string | null
        rooms_count?: number
      }
        Update: {
        id?: string
        source?: Database["public"]["Enums"]["request_source"]
        property_id?: string | null
        room_id?: string
        owner_id?: string
        agent_id?: string | null
        collection_id?: string | null
        guest_name?: string
        guest_phone?: string
        guest_email?: string | null
        guest_comment?: string | null
        adults_count?: number
        children_count?: number
        check_in?: string
        check_out?: string
        status?: Database["public"]["Enums"]["request_status"]
        transferred_to_owner_at?: string | null
        owner_confirmed_at?: string | null
        completed_at?: string | null
        base_price_per_night?: number | null
        agent_markup_percent?: number | null
        total_price?: number | null
        pricing_snapshot?: Json
        created_at?: string
        updated_at?: string
        completion_requested_at?: string | null
        rooms_count?: number
      }
        Relationships: [
        {
          foreignKeyName: "guest_requests_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "guest_requests_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "guest_requests_owner_id_fkey"
          columns: ["owner_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "guest_requests_agent_id_fkey"
          columns: ["agent_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "guest_requests_collection_id_fkey"
          columns: ["collection_id"]
          isOneToOne: false
          referencedRelation: "collections"
          referencedColumns: ["id"]
        }
      ]
      }
      notification_deliveries: {
        Row: {
        id: string
        notification_id: string
        recipient_id: string
        channel: string
        delivery_target_key: string
        push_subscription_id: string | null
        status: string
        provider_message_id: string | null
        error_code: string | null
        error_message: string | null
        sent_at: string | null
        created_at: string
        telegram_chat_id: string | null
        updated_at: string
      }
        Insert: {
        id?: string
        notification_id: string
        recipient_id: string
        channel: string
        delivery_target_key: string
        push_subscription_id?: string | null
        status: string
        provider_message_id?: string | null
        error_code?: string | null
        error_message?: string | null
        sent_at?: string | null
        created_at?: string
        telegram_chat_id?: string | null
        updated_at?: string
      }
        Update: {
        id?: string
        notification_id?: string
        recipient_id?: string
        channel?: string
        delivery_target_key?: string
        push_subscription_id?: string | null
        status?: string
        provider_message_id?: string | null
        error_code?: string | null
        error_message?: string | null
        sent_at?: string | null
        created_at?: string
        telegram_chat_id?: string | null
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "notification_deliveries_notification_id_fkey"
          columns: ["notification_id"]
          isOneToOne: false
          referencedRelation: "notifications"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "notification_deliveries_recipient_id_fkey"
          columns: ["recipient_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "notification_deliveries_push_subscription_id_fkey"
          columns: ["push_subscription_id"]
          isOneToOne: false
          referencedRelation: "push_subscriptions"
          referencedColumns: ["id"]
        }
      ]
      }
      notification_settings: {
        Row: {
        profile_id: string
        push_enabled: boolean
        in_app_enabled: boolean
        telegram_enabled: boolean
        created_at: string
        updated_at: string
      }
        Insert: {
        profile_id: string
        push_enabled?: boolean
        in_app_enabled?: boolean
        telegram_enabled?: boolean
        created_at?: string
        updated_at?: string
      }
        Update: {
        profile_id?: string
        push_enabled?: boolean
        in_app_enabled?: boolean
        telegram_enabled?: boolean
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "notification_settings_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      notifications: {
        Row: {
        id: string
        recipient_id: string
        channel: string
        event_type: string
        idempotency_key: string
        payload: Json
        read_at: string | null
        created_at: string
      }
        Insert: {
        id?: string
        recipient_id: string
        channel?: string
        event_type: string
        idempotency_key: string
        payload: Json
        read_at?: string | null
        created_at?: string
      }
        Update: {
        id?: string
        recipient_id?: string
        channel?: string
        event_type?: string
        idempotency_key?: string
        payload?: Json
        read_at?: string | null
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "notifications_recipient_id_fkey"
          columns: ["recipient_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      profiles: {
        Row: {
        id: string
        auth_user_id: string | null
        slug: string | null
        display_name: string
        phone: string | null
        whatsapp: string | null
        telegram: string | null
        created_at: string
        updated_at: string
        is_public_hidden_by_admin: boolean
        agent_public_id: string | null
      }
        Insert: {
        id?: string
        auth_user_id?: string | null
        slug?: string | null
        display_name: string
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        created_at?: string
        updated_at?: string
        is_public_hidden_by_admin?: boolean
        agent_public_id?: string | null
      }
        Update: {
        id?: string
        auth_user_id?: string | null
        slug?: string | null
        display_name?: string
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        created_at?: string
        updated_at?: string
        is_public_hidden_by_admin?: boolean
        agent_public_id?: string | null
      }
        Relationships: []
      }
      properties: {
        Row: {
        id: string
        owner_id: string
        slug: string
        title: string
        short_title: string
        property_type: string
        city: string
        address: string
        timezone: string
        short_description: string | null
        full_description: string | null
        phone: string | null
        whatsapp: string | null
        telegram: string | null
        check_in_time: string | null
        check_out_time: string | null
        published: boolean
        is_frozen: boolean
        allow_agent_inquiries: boolean
        allow_owner_contact_sharing: boolean
        cover_image_url: string | null
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        owner_id: string
        slug: string
        title: string
        short_title: string
        property_type: string
        city: string
        address: string
        timezone?: string
        short_description?: string | null
        full_description?: string | null
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        check_in_time?: string | null
        check_out_time?: string | null
        published?: boolean
        is_frozen?: boolean
        allow_agent_inquiries?: boolean
        allow_owner_contact_sharing?: boolean
        cover_image_url?: string | null
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        owner_id?: string
        slug?: string
        title?: string
        short_title?: string
        property_type?: string
        city?: string
        address?: string
        timezone?: string
        short_description?: string | null
        full_description?: string | null
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        check_in_time?: string | null
        check_out_time?: string | null
        published?: boolean
        is_frozen?: boolean
        allow_agent_inquiries?: boolean
        allow_owner_contact_sharing?: boolean
        cover_image_url?: string | null
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "properties_owner_id_fkey"
          columns: ["owner_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      property_features: {
        Row: {
        id: string
        property_id: string
        label: string
        sort_order: number
      }
        Insert: {
        id?: string
        property_id: string
        label: string
        sort_order?: number
      }
        Update: {
        id?: string
        property_id?: string
        label?: string
        sort_order?: number
      }
        Relationships: [
        {
          foreignKeyName: "property_features_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        }
      ]
      }
      property_photos: {
        Row: {
        id: string
        property_id: string
        storage_path: string
        public_url: string
        sort_order: number
        created_at: string
      }
        Insert: {
        id?: string
        property_id: string
        storage_path: string
        public_url: string
        sort_order?: number
        created_at?: string
      }
        Update: {
        id?: string
        property_id?: string
        storage_path?: string
        public_url?: string
        sort_order?: number
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "property_photos_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        }
      ]
      }
      property_rules: {
        Row: {
        id: string
        property_id: string
        label: string
        sort_order: number
      }
        Insert: {
        id?: string
        property_id: string
        label: string
        sort_order?: number
      }
        Update: {
        id?: string
        property_id?: string
        label?: string
        sort_order?: number
      }
        Relationships: [
        {
          foreignKeyName: "property_rules_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        }
      ]
      }
      push_subscriptions: {
        Row: {
        id: string
        profile_id: string
        endpoint: string
        p256dh: string
        auth: string
        user_agent: string | null
        device_label: string | null
        last_seen_at: string
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        profile_id: string
        endpoint: string
        p256dh: string
        auth: string
        user_agent?: string | null
        device_label?: string | null
        last_seen_at?: string
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        profile_id?: string
        endpoint?: string
        p256dh?: string
        auth?: string
        user_agent?: string | null
        device_label?: string | null
        last_seen_at?: string
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "push_subscriptions_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      referral_invites: {
        Row: {
        id: string
        token: string
        inviter_profile_id: string
        inviter_role: Database["public"]["Enums"]["app_role"]
        invitee_role: Database["public"]["Enums"]["app_role"]
        intent: Database["public"]["Enums"]["referral_invite_intent"]
        target_type: string | null
        target_id: string | null
        status: Database["public"]["Enums"]["referral_invite_status"]
        used_by_profile_id: string | null
        used_at: string | null
        expires_at: string | null
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        token: string
        inviter_profile_id: string
        inviter_role: Database["public"]["Enums"]["app_role"]
        invitee_role: Database["public"]["Enums"]["app_role"]
        intent?: Database["public"]["Enums"]["referral_invite_intent"]
        target_type?: string | null
        target_id?: string | null
        status?: Database["public"]["Enums"]["referral_invite_status"]
        used_by_profile_id?: string | null
        used_at?: string | null
        expires_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        token?: string
        inviter_profile_id?: string
        inviter_role?: Database["public"]["Enums"]["app_role"]
        invitee_role?: Database["public"]["Enums"]["app_role"]
        intent?: Database["public"]["Enums"]["referral_invite_intent"]
        target_type?: string | null
        target_id?: string | null
        status?: Database["public"]["Enums"]["referral_invite_status"]
        used_by_profile_id?: string | null
        used_at?: string | null
        expires_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "referral_invites_inviter_profile_id_fkey"
          columns: ["inviter_profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "referral_invites_used_by_profile_id_fkey"
          columns: ["used_by_profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      referral_rewards: {
        Row: {
        id: string
        invite_id: string
        inviter_profile_id: string
        invited_profile_id: string
        milestone_type: Database["public"]["Enums"]["referral_milestone_type"]
        milestone_reached_at: string
        approval_status: Database["public"]["Enums"]["referral_approval_status"]
        reward_days: number
        approved_by_admin_id: string | null
        approved_at: string | null
        rejected_at: string | null
        applied_role_contexts: Database["public"]["Enums"]["app_role"][]
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        invite_id: string
        inviter_profile_id: string
        invited_profile_id: string
        milestone_type: Database["public"]["Enums"]["referral_milestone_type"]
        milestone_reached_at: string
        approval_status?: Database["public"]["Enums"]["referral_approval_status"]
        reward_days?: number
        approved_by_admin_id?: string | null
        approved_at?: string | null
        rejected_at?: string | null
        applied_role_contexts: Database["public"]["Enums"]["app_role"][]
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        invite_id?: string
        inviter_profile_id?: string
        invited_profile_id?: string
        milestone_type?: Database["public"]["Enums"]["referral_milestone_type"]
        milestone_reached_at?: string
        approval_status?: Database["public"]["Enums"]["referral_approval_status"]
        reward_days?: number
        approved_by_admin_id?: string | null
        approved_at?: string | null
        rejected_at?: string | null
        applied_role_contexts?: Database["public"]["Enums"]["app_role"][]
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "referral_rewards_invite_id_fkey"
          columns: ["invite_id"]
          isOneToOne: false
          referencedRelation: "referral_invites"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "referral_rewards_inviter_profile_id_fkey"
          columns: ["inviter_profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "referral_rewards_invited_profile_id_fkey"
          columns: ["invited_profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "referral_rewards_approved_by_admin_id_fkey"
          columns: ["approved_by_admin_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      room_agent_markups: {
        Row: {
        id: string
        room_id: string
        agent_id: string
        markup_percent: number
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        room_id: string
        agent_id: string
        markup_percent?: number
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        room_id?: string
        agent_id?: string
        markup_percent?: number
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "room_agent_markups_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "room_agent_markups_agent_id_fkey"
          columns: ["agent_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      room_amenities: {
        Row: {
        id: string
        room_id: string
        label: string
        sort_order: number
      }
        Insert: {
        id?: string
        room_id: string
        label: string
        sort_order?: number
      }
        Update: {
        id?: string
        room_id?: string
        label?: string
        sort_order?: number
      }
        Relationships: [
        {
          foreignKeyName: "room_amenities_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        }
      ]
      }
      room_busy_ranges: {
        Row: {
        id: string
        room_id: string
        starts_on: string
        ends_on: string
        source: string
        label: string | null
        note: string | null
        created_at: string
      }
        Insert: {
        id?: string
        room_id: string
        starts_on: string
        ends_on: string
        source?: string
        label?: string | null
        note?: string | null
        created_at?: string
      }
        Update: {
        id?: string
        room_id?: string
        starts_on?: string
        ends_on?: string
        source?: string
        label?: string | null
        note?: string | null
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "room_busy_ranges_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        }
      ]
      }
      room_photos: {
        Row: {
        id: string
        room_id: string
        storage_path: string
        public_url: string
        sort_order: number
        created_at: string
      }
        Insert: {
        id?: string
        room_id: string
        storage_path: string
        public_url: string
        sort_order?: number
        created_at?: string
      }
        Update: {
        id?: string
        room_id?: string
        storage_path?: string
        public_url?: string
        sort_order?: number
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "room_photos_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        }
      ]
      }
      room_seasonal_prices: {
        Row: {
        id: string
        room_id: string
        starts_on: string
        ends_on: string
        price_per_night: number
        is_active: boolean
        created_at: string
      }
        Insert: {
        id?: string
        room_id: string
        starts_on: string
        ends_on: string
        price_per_night: number
        is_active?: boolean
        created_at?: string
      }
        Update: {
        id?: string
        room_id?: string
        starts_on?: string
        ends_on?: string
        price_per_night?: number
        is_active?: boolean
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "room_seasonal_prices_room_id_fkey"
          columns: ["room_id"]
          isOneToOne: false
          referencedRelation: "rooms"
          referencedColumns: ["id"]
        }
      ]
      }
      rooms: {
        Row: {
        id: string
        property_id: string | null
        slug: string
        title: string
        subtitle: string | null
        capacity: number
        bedrooms: number
        area: number
        price_per_night: number
        is_active: boolean
        created_at: string
        updated_at: string
        owner_id: string
        room_kind: string
        property_type: string | null
        city: string | null
        address: string | null
        timezone: string | null
        short_description: string | null
        full_description: string | null
        phone: string | null
        whatsapp: string | null
        telegram: string | null
        check_in_time: string | null
        check_out_time: string | null
        allow_agent_inquiries: boolean
        allow_owner_contact_sharing: boolean
      }
        Insert: {
        id?: string
        property_id?: string | null
        slug: string
        title: string
        subtitle?: string | null
        capacity?: number
        bedrooms?: number
        area?: number
        price_per_night: number
        is_active?: boolean
        created_at?: string
        updated_at?: string
        owner_id: string
        room_kind?: string
        property_type?: string | null
        city?: string | null
        address?: string | null
        timezone?: string | null
        short_description?: string | null
        full_description?: string | null
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        check_in_time?: string | null
        check_out_time?: string | null
        allow_agent_inquiries?: boolean
        allow_owner_contact_sharing?: boolean
      }
        Update: {
        id?: string
        property_id?: string | null
        slug?: string
        title?: string
        subtitle?: string | null
        capacity?: number
        bedrooms?: number
        area?: number
        price_per_night?: number
        is_active?: boolean
        created_at?: string
        updated_at?: string
        owner_id?: string
        room_kind?: string
        property_type?: string | null
        city?: string | null
        address?: string | null
        timezone?: string | null
        short_description?: string | null
        full_description?: string | null
        phone?: string | null
        whatsapp?: string | null
        telegram?: string | null
        check_in_time?: string | null
        check_out_time?: string | null
        allow_agent_inquiries?: boolean
        allow_owner_contact_sharing?: boolean
      }
        Relationships: [
        {
          foreignKeyName: "rooms_property_id_fkey"
          columns: ["property_id"]
          isOneToOne: false
          referencedRelation: "properties"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "rooms_owner_id_fkey"
          columns: ["owner_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      subscription_audit_events: {
        Row: {
        id: string
        subscription_id: string
        profile_id: string
        role_context: Database["public"]["Enums"]["app_role"]
        actor_profile_id: string
        event_type: string
        previous_status: Database["public"]["Enums"]["subscription_status"] | null
        next_status: Database["public"]["Enums"]["subscription_status"]
        previous_paid_until: string | null
        next_paid_until: string | null
        extension_days: number | null
        details: Json
        created_at: string
      }
        Insert: {
        id?: string
        subscription_id: string
        profile_id: string
        role_context: Database["public"]["Enums"]["app_role"]
        actor_profile_id: string
        event_type: string
        previous_status?: Database["public"]["Enums"]["subscription_status"] | null
        next_status: Database["public"]["Enums"]["subscription_status"]
        previous_paid_until?: string | null
        next_paid_until?: string | null
        extension_days?: number | null
        details?: Json
        created_at?: string
      }
        Update: {
        id?: string
        subscription_id?: string
        profile_id?: string
        role_context?: Database["public"]["Enums"]["app_role"]
        actor_profile_id?: string
        event_type?: string
        previous_status?: Database["public"]["Enums"]["subscription_status"] | null
        next_status?: Database["public"]["Enums"]["subscription_status"]
        previous_paid_until?: string | null
        next_paid_until?: string | null
        extension_days?: number | null
        details?: Json
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "subscription_audit_events_actor_profile_id_fkey"
          columns: ["actor_profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "subscription_audit_events_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        },
        {
          foreignKeyName: "subscription_audit_events_subscription_id_fkey"
          columns: ["subscription_id"]
          isOneToOne: false
          referencedRelation: "subscriptions"
          referencedColumns: ["id"]
        }
      ]
      }
      subscriptions: {
        Row: {
        id: string
        profile_id: string
        role_context: Database["public"]["Enums"]["app_role"]
        status: Database["public"]["Enums"]["subscription_status"]
        plan_name: string
        active_room_limit: number | null
        trial_ends_at: string | null
        grace_ends_at: string | null
        paid_until: string | null
        created_at: string
        updated_at: string
      }
        Insert: {
        id?: string
        profile_id: string
        role_context: Database["public"]["Enums"]["app_role"]
        status?: Database["public"]["Enums"]["subscription_status"]
        plan_name?: string
        active_room_limit?: number | null
        trial_ends_at?: string | null
        grace_ends_at?: string | null
        paid_until?: string | null
        created_at?: string
        updated_at?: string
      }
        Update: {
        id?: string
        profile_id?: string
        role_context?: Database["public"]["Enums"]["app_role"]
        status?: Database["public"]["Enums"]["subscription_status"]
        plan_name?: string
        active_room_limit?: number | null
        trial_ends_at?: string | null
        grace_ends_at?: string | null
        paid_until?: string | null
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "subscriptions_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      telegram_notification_connections: {
        Row: {
        profile_id: string
        telegram_chat_id: string | null
        telegram_user_id: string | null
        telegram_username: string | null
        telegram_first_name: string | null
        telegram_last_name: string | null
        link_token_hash: string | null
        link_token_expires_at: string | null
        linked_at: string | null
        last_seen_at: string | null
        created_at: string
        updated_at: string
      }
        Insert: {
        profile_id: string
        telegram_chat_id?: string | null
        telegram_user_id?: string | null
        telegram_username?: string | null
        telegram_first_name?: string | null
        telegram_last_name?: string | null
        link_token_hash?: string | null
        link_token_expires_at?: string | null
        linked_at?: string | null
        last_seen_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Update: {
        profile_id?: string
        telegram_chat_id?: string | null
        telegram_user_id?: string | null
        telegram_username?: string | null
        telegram_first_name?: string | null
        telegram_last_name?: string | null
        link_token_hash?: string | null
        link_token_expires_at?: string | null
        linked_at?: string | null
        last_seen_at?: string | null
        created_at?: string
        updated_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "telegram_notification_connections_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
      user_roles: {
        Row: {
        profile_id: string
        role: Database["public"]["Enums"]["app_role"]
        created_at: string
      }
        Insert: {
        profile_id: string
        role: Database["public"]["Enums"]["app_role"]
        created_at?: string
      }
        Update: {
        profile_id?: string
        role?: Database["public"]["Enums"]["app_role"]
        created_at?: string
      }
        Relationships: [
        {
          foreignKeyName: "user_roles_profile_id_fkey"
          columns: ["profile_id"]
          isOneToOne: false
          referencedRelation: "profiles"
          referencedColumns: ["id"]
        }
      ]
      }
    }
    Views: Record<string, never>
    Functions: {
      admin_review_referral_reward: {
        Args: {
          p_actor_profile_id: string
          p_decision: Database["public"]["Enums"]["referral_approval_status"]
          p_reward_id: string
        }
        Returns: string
      }
      admin_set_profile_public_visibility: {
        Args: {
          p_actor_profile_id: string
          p_hidden: boolean
          p_profile_id: string
        }
        Returns: string
      }
      admin_set_property_frozen: {
        Args: {
          p_actor_profile_id: string
          p_frozen: boolean
          p_property_id: string
        }
        Returns: string
      }
      admin_extend_subscription: {
        Args: {
          p_actor_profile_id: string
          p_extension_days?: number
          p_profile_id: string
          p_role_context: Database["public"]["Enums"]["app_role"]
        }
        Returns: string
      }
      current_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string | null
      }
      consume_referral_invite: {
        Args: {
          p_invite_token: string
          p_invited_profile_id: string
          p_invitee_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      record_collection_open: {
        Args: {
          p_collection_slug: string
          p_visitor_key: string
        }
        Returns: boolean
      }
      record_referral_milestone: {
        Args: {
          p_invited_profile_id: string
          p_milestone_type: Database["public"]["Enums"]["referral_milestone_type"]
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_link_status: "pending" | "active" | "declined" | "revoked"
      app_role: "owner" | "agent" | "admin"
      referral_approval_status: "pending" | "approved" | "rejected"
      referral_invite_intent: "join_app" | "collaboration"
      referral_invite_status: "active" | "used" | "revoked" | "expired"
      referral_milestone_type: "owner_inventory_created" | "agent_first_active_collaboration"
      request_source: "owner" | "agent" | "collection"
      request_status: "new" | "accepted_by_owner" | "rejected" | "transferred_to_owner" | "completed"
      subscription_status: "trial" | "active" | "grace" | "expired" | "manual"
    }
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"]) | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] & Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    ? (PublicSchema["Tables"] & PublicSchema["Views"])[PublicTableNameOrOptions] extends { Row: infer Row }
      ? Row
      : never
    : never;

export type TablesInsert<PublicTableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][PublicTableName] extends {
  Insert: infer Insert
}
  ? Insert
  : never;

export type TablesUpdate<PublicTableName extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][PublicTableName] extends {
  Update: infer Update
}
  ? Update
  : never;

export type Enums<PublicEnumName extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][PublicEnumName];
