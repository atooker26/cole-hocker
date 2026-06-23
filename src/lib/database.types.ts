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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          shopify_customer_id: string | null
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          shopify_customer_id?: string | null
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          shopify_customer_id?: string | null
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      email_log: {
        Row: {
          created_at: string
          dedupe_key: string
          id: string
          message_id: string | null
          recipient: string
          subject: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          id?: string
          message_id?: string | null
          recipient: string
          subject: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          id?: string
          message_id?: string | null
          recipient?: string
          subject?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          quantity: number
          track: boolean
          updated_at: string
          variant_id: string
        }
        Insert: {
          quantity?: number
          track?: boolean
          updated_at?: string
          variant_id: string
        }
        Update: {
          quantity?: number
          track?: boolean
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_title: string
          quantity: number
          subtotal_cents: number
          unit_price_cents: number
          variant_id: string | null
          variant_title: string
        }
        Insert: {
          id?: string
          order_id: string
          product_title: string
          quantity: number
          subtotal_cents: number
          unit_price_cents: number
          variant_id?: string | null
          variant_title: string
        }
        Update: {
          id?: string
          order_id?: string
          product_title?: string
          quantity?: number
          subtotal_cents?: number
          unit_price_cents?: number
          variant_id?: string | null
          variant_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cole_amount_cents: number
          connect_cole_account_id: string | null
          connect_kirk_account_id: string | null
          connect_transfer_status: string
          created_at: string
          currency: string
          customer_id: string | null
          email: string
          fulfillment_status: string
          id: string
          kirk_amount_cents: number
          kirk_pct: number
          order_number: number
          platform_amount_cents: number
          shipping_address: Json | null
          shipping_cents: number
          shipstation_order_id: string | null
          shopify_order_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          tracking_carrier: string | null
          tracking_number: string | null
        }
        Insert: {
          cole_amount_cents?: number
          connect_cole_account_id?: string | null
          connect_kirk_account_id?: string | null
          connect_transfer_status?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          email: string
          fulfillment_status?: string
          id?: string
          kirk_amount_cents?: number
          kirk_pct?: number
          order_number?: never
          platform_amount_cents?: number
          shipping_address?: Json | null
          shipping_cents?: number
          shipstation_order_id?: string | null
          shopify_order_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          tracking_carrier?: string | null
          tracking_number?: string | null
        }
        Update: {
          cole_amount_cents?: number
          connect_cole_account_id?: string | null
          connect_kirk_account_id?: string | null
          connect_transfer_status?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          email?: string
          fulfillment_status?: string
          id?: string
          kirk_amount_cents?: number
          kirk_pct?: number
          order_number?: never
          platform_amount_cents?: number
          shipping_address?: Json | null
          shipping_cents?: number
          shipstation_order_id?: string | null
          shopify_order_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          tracking_carrier?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_concepts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          images: Json
          kirk_notified_at: string | null
          notes: string | null
          product_id: string | null
          sizes: string | null
          status: string
          target_price_cents: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          images?: Json
          kirk_notified_at?: string | null
          notes?: string | null
          product_id?: string | null
          sizes?: string | null
          status?: string
          target_price_cents?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          images?: Json
          kirk_notified_at?: string | null
          notes?: string | null
          product_id?: string | null
          sizes?: string | null
          status?: string
          target_price_cents?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_concepts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          handle: string
          id: string
          images: Json
          shopify_product_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          handle: string
          id?: string
          images?: Json
          shopify_product_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          handle?: string
          id?: string
          images?: Json
          shopify_product_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          cole_connect_account_id: string | null
          connect_enabled: boolean
          id: number
          kirk_connect_account_id: string | null
          kirk_pct: number
          notify_email: string | null
          platform_pct: number
          shipping_flat_cents: number
          free_shipping_threshold_cents: number
          shipping_tiers: Json
          updated_at: string
        }
        Insert: {
          cole_connect_account_id?: string | null
          connect_enabled?: boolean
          id?: number
          kirk_connect_account_id?: string | null
          kirk_pct?: number
          notify_email?: string | null
          platform_pct?: number
          shipping_flat_cents?: number
          free_shipping_threshold_cents?: number
          shipping_tiers?: Json
          updated_at?: string
        }
        Update: {
          cole_connect_account_id?: string | null
          connect_enabled?: boolean
          id?: number
          kirk_connect_account_id?: string | null
          kirk_pct?: number
          notify_email?: string | null
          platform_pct?: number
          shipping_flat_cents?: number
          free_shipping_threshold_cents?: number
          shipping_tiers?: Json
          updated_at?: string
        }
        Relationships: []
      }
      variants: {
        Row: {
          created_at: string
          currency: string
          id: string
          position: number
          price_cents: number
          product_id: string
          shopify_variant_id: string | null
          sku: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          position?: number
          price_cents: number
          product_id: string
          shopify_variant_id?: string | null
          sku?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          position?: number
          price_cents?: number
          product_id?: string
          shopify_variant_id?: string | null
          sku?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_inventory: {
        Args: { p_qty: number; p_variant_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
