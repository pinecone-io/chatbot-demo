export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          created_at: string
          entry: string | null
          id: string
          speaker: Database["public"]["Enums"]["speaker"]
          user_id: string
        }
        Insert: {
          created_at?: string
          entry?: string | null
          id?: string
          speaker: Database["public"]["Enums"]["speaker"]
          user_id: string
        }
        Update: {
          created_at?: string
          entry?: string | null
          id?: string
          speaker?: Database["public"]["Enums"]["speaker"]
          user_id?: string
        }
      }
      documents: {
        Row: {
          content: string | null
          embedding: unknown | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: unknown | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: unknown | null
          id?: number
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      match_documents: {
        Args: {
          query_embedding: unknown
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      vector_dims: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      vector_norm: {
        Args: {
          "": unknown
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      speaker: "user" | "ai"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

