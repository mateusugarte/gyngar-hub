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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          titulo: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          titulo?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          titulo?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tokens_usados: number | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tokens_usados?: number | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tokens_usados?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_usage_logs: {
        Row: {
          date: string
          id: string
          total_messages: number
          total_tokens: number
          user_id: string
        }
        Insert: {
          date: string
          id?: string
          total_messages?: number
          total_tokens?: number
          user_id: string
        }
        Update: {
          date?: string
          id?: string
          total_messages?: number
          total_tokens?: number
          user_id?: string
        }
        Relationships: []
      }
      content_calendar: {
        Row: {
          created_at: string
          data_planejada: string
          id: string
          idea_id: string | null
          notificacao_enviada: boolean
          status: Database["public"]["Enums"]["status_content"]
          user_id: string
        }
        Insert: {
          created_at?: string
          data_planejada: string
          id?: string
          idea_id?: string | null
          notificacao_enviada?: boolean
          status?: Database["public"]["Enums"]["status_content"]
          user_id: string
        }
        Update: {
          created_at?: string
          data_planejada?: string
          id?: string
          idea_id?: string | null
          notificacao_enviada?: boolean
          status?: Database["public"]["Enums"]["status_content"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_calendar_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          created_at: string
          cta_ideas: string[] | null
          data_agendada: string | null
          hashtags: string[] | null
          hook_ideas: string[] | null
          id: string
          ig_media_id: string | null
          legenda: string | null
          objetivo: string | null
          oferta_isca: string | null
          palavra_isca: string | null
          pilar: string | null
          roteiro_sugestao: string | null
          status: Database["public"]["Enums"]["status_content"]
          tipo: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cta_ideas?: string[] | null
          data_agendada?: string | null
          hashtags?: string[] | null
          hook_ideas?: string[] | null
          id?: string
          ig_media_id?: string | null
          legenda?: string | null
          objetivo?: string | null
          oferta_isca?: string | null
          palavra_isca?: string | null
          pilar?: string | null
          roteiro_sugestao?: string | null
          status?: Database["public"]["Enums"]["status_content"]
          tipo?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cta_ideas?: string[] | null
          data_agendada?: string | null
          hashtags?: string[] | null
          hook_ideas?: string[] | null
          id?: string
          ig_media_id?: string | null
          legenda?: string | null
          objetivo?: string | null
          oferta_isca?: string | null
          palavra_isca?: string | null
          pilar?: string | null
          roteiro_sugestao?: string | null
          status?: Database["public"]["Enums"]["status_content"]
          tipo?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      instagram_comments: {
        Row: {
          autor_ig: string | null
          contem_palavra_isca: boolean
          created_at: string
          data: string | null
          id: string
          ig_comment_id: string
          post_id: string | null
          texto: string | null
          user_id: string
        }
        Insert: {
          autor_ig?: string | null
          contem_palavra_isca?: boolean
          created_at?: string
          data?: string | null
          id?: string
          ig_comment_id: string
          post_id?: string | null
          texto?: string | null
          user_id: string
        }
        Update: {
          autor_ig?: string | null
          contem_palavra_isca?: boolean
          created_at?: string
          data?: string | null
          id?: string
          ig_comment_id?: string
          post_id?: string | null
          texto?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "instagram_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_posts: {
        Row: {
          ai_evaluation: Json | null
          avg_watch_time_ms: number | null
          caption: string | null
          comments_count: number | null
          created_at: string
          data_publicacao: string | null
          id: string
          ig_media_id: string
          impressions: number | null
          is_isca: boolean | null
          likes: number | null
          media_url: string | null
          permalink: string | null
          reach: number | null
          reach_followers: number | null
          reach_non_followers: number | null
          saved: number | null
          shares: number | null
          thumbnail_url: string | null
          tipo: string | null
          user_id: string
          video_plays: number | null
          views: number | null
        }
        Insert: {
          ai_evaluation?: Json | null
          avg_watch_time_ms?: number | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          data_publicacao?: string | null
          id?: string
          ig_media_id: string
          impressions?: number | null
          is_isca?: boolean | null
          likes?: number | null
          media_url?: string | null
          permalink?: string | null
          reach?: number | null
          reach_followers?: number | null
          reach_non_followers?: number | null
          saved?: number | null
          shares?: number | null
          thumbnail_url?: string | null
          tipo?: string | null
          user_id: string
          video_plays?: number | null
          views?: number | null
        }
        Update: {
          ai_evaluation?: Json | null
          avg_watch_time_ms?: number | null
          caption?: string | null
          comments_count?: number | null
          created_at?: string
          data_publicacao?: string | null
          id?: string
          ig_media_id?: string
          impressions?: number | null
          is_isca?: boolean | null
          likes?: number | null
          media_url?: string | null
          permalink?: string | null
          reach?: number | null
          reach_followers?: number | null
          reach_non_followers?: number | null
          saved?: number | null
          shares?: number | null
          thumbnail_url?: string | null
          tipo?: string | null
          user_id?: string
          video_plays?: number | null
          views?: number | null
        }
        Relationships: []
      }
      leads_instagram: {
        Row: {
          comentario: string | null
          convertido: boolean
          data_captura: string
          id: string
          ig_username: string
          palavra_isca: string | null
          post_id: string | null
          user_id: string
        }
        Insert: {
          comentario?: string | null
          convertido?: boolean
          data_captura?: string
          id?: string
          ig_username: string
          palavra_isca?: string | null
          post_id?: string | null
          user_id: string
        }
        Update: {
          comentario?: string | null
          convertido?: boolean
          data_captura?: string
          id?: string
          ig_username?: string
          palavra_isca?: string | null
          post_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads_qualified: {
        Row: {
          alerta_parado: string | null
          cidade: string | null
          created_at: string
          data_entrada_etapa: string
          email: string | null
          empresa: string | null
          etapa: Database["public"]["Enums"]["etapa_pipeline"]
          id: string
          instagram: string | null
          nicho: string | null
          nome: string | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["origem_lead"] | null
          origem_detalhe: Json | null
          porte: string | null
          proxima_acao: Json | null
          score: Database["public"]["Enums"]["score_lead"] | null
          site: string | null
          tags: string[] | null
          telefone: string | null
          updated_at: string
          user_id: string
          valor_potencial: number | null
        }
        Insert: {
          alerta_parado?: string | null
          cidade?: string | null
          created_at?: string
          data_entrada_etapa?: string
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_pipeline"]
          id?: string
          instagram?: string | null
          nicho?: string | null
          nome?: string | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_lead"] | null
          origem_detalhe?: Json | null
          porte?: string | null
          proxima_acao?: Json | null
          score?: Database["public"]["Enums"]["score_lead"] | null
          site?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor_potencial?: number | null
        }
        Update: {
          alerta_parado?: string | null
          cidade?: string | null
          created_at?: string
          data_entrada_etapa?: string
          email?: string | null
          empresa?: string | null
          etapa?: Database["public"]["Enums"]["etapa_pipeline"]
          id?: string
          instagram?: string | null
          nicho?: string | null
          nome?: string | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["origem_lead"] | null
          origem_detalhe?: Json | null
          porte?: string | null
          proxima_acao?: Json | null
          score?: Database["public"]["Enums"]["score_lead"] | null
          site?: string | null
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor_potencial?: number | null
        }
        Relationships: []
      }
      leads_raw: {
        Row: {
          created_at: string
          dados_brutos: Json
          id: string
          instagram_handle: string | null
          processado: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          dados_brutos?: Json
          id?: string
          instagram_handle?: string | null
          processado?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          dados_brutos?: Json
          id?: string
          instagram_handle?: string | null
          processado?: boolean
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link_destino: string | null
          mensagem: string
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link_destino?: string | null
          mensagem: string
          tipo: Database["public"]["Enums"]["tipo_notificacao"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link_destino?: string | null
          mensagem?: string
          tipo?: Database["public"]["Enums"]["tipo_notificacao"]
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          created_at: string
          etapa: Database["public"]["Enums"]["etapa_pipeline"]
          id: string
          ordem: number
          user_id: string
        }
        Insert: {
          created_at?: string
          etapa: Database["public"]["Enums"]["etapa_pipeline"]
          id?: string
          ordem: number
          user_id: string
        }
        Update: {
          created_at?: string
          etapa?: Database["public"]["Enums"]["etapa_pipeline"]
          id?: string
          ordem?: number
          user_id?: string
        }
        Relationships: []
      }
      scraping_jobs: {
        Row: {
          apify_run_id: string | null
          created_at: string
          filtros: Json | null
          fonte: Database["public"]["Enums"]["fonte_job"]
          id: string
          status: Database["public"]["Enums"]["status_job"]
          total_coletado: number | null
          total_qualificados: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apify_run_id?: string | null
          created_at?: string
          filtros?: Json | null
          fonte: Database["public"]["Enums"]["fonte_job"]
          id?: string
          status?: Database["public"]["Enums"]["status_job"]
          total_coletado?: number | null
          total_qualificados?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apify_run_id?: string | null
          created_at?: string
          filtros?: Json | null
          fonte?: Database["public"]["Enums"]["fonte_job"]
          id?: string
          status?: Database["public"]["Enums"]["status_job"]
          total_coletado?: number | null
          total_qualificados?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          created_at: string
          id: string
          prospeccoes_diarias_meta: number
          reunioes_meta: number
          updated_at: string
          user_id: string
          vendas_meta: number
        }
        Insert: {
          created_at?: string
          id?: string
          prospeccoes_diarias_meta?: number
          reunioes_meta?: number
          updated_at?: string
          user_id: string
          vendas_meta?: number
        }
        Update: {
          created_at?: string
          id?: string
          prospeccoes_diarias_meta?: number
          reunioes_meta?: number
          updated_at?: string
          user_id?: string
          vendas_meta?: number
        }
        Relationships: []
      }
      user_marketing_context: {
        Row: {
          context: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          apify_api_key: string | null
          created_at: string
          id: string
          ig_access_token: string | null
          ig_account_id: string | null
          onboarding_completed: boolean
          onboarding_step: number
          plan_tier: Database["public"]["Enums"]["plano"]
          updated_at: string
          user_id: string
        }
        Insert: {
          apify_api_key?: string | null
          created_at?: string
          id?: string
          ig_access_token?: string | null
          ig_account_id?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          plan_tier?: Database["public"]["Enums"]["plano"]
          updated_at?: string
          user_id: string
        }
        Update: {
          apify_api_key?: string | null
          created_at?: string
          id?: string
          ig_access_token?: string | null
          ig_account_id?: string | null
          onboarding_completed?: boolean
          onboarding_step?: number
          plan_tier?: Database["public"]["Enums"]["plano"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      etapa_pipeline:
        | "primeiro_contato"
        | "possivel_interesse"
        | "reuniao_agendada"
        | "venda_concluida"
        | "follow_up"
        | "recusa"
      fonte_job: "ig_comentarios" | "ig_seguidores" | "google_maps" | "linkedin"
      origem_lead:
        | "instagram_comentario"
        | "instagram_seguidor"
        | "google_maps"
        | "linkedin"
        | "manual"
        | "indicacao"
      plano: "free" | "pro" | "enterprise"
      score_lead: "A" | "B" | "C"
      status_content:
        | "ideia"
        | "producao"
        | "agendado"
        | "publicado"
        | "cancelado"
      status_job: "pendente" | "rodando" | "concluido" | "erro"
      tipo_notificacao:
        | "lead_parado"
        | "job_concluido"
        | "token_expirando"
        | "post_hora"
        | "meta_atingida"
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
    Enums: {
      etapa_pipeline: [
        "primeiro_contato",
        "possivel_interesse",
        "reuniao_agendada",
        "venda_concluida",
        "follow_up",
        "recusa",
      ],
      fonte_job: ["ig_comentarios", "ig_seguidores", "google_maps", "linkedin"],
      origem_lead: [
        "instagram_comentario",
        "instagram_seguidor",
        "google_maps",
        "linkedin",
        "manual",
        "indicacao",
      ],
      plano: ["free", "pro", "enterprise"],
      score_lead: ["A", "B", "C"],
      status_content: [
        "ideia",
        "producao",
        "agendado",
        "publicado",
        "cancelado",
      ],
      status_job: ["pendente", "rodando", "concluido", "erro"],
      tipo_notificacao: [
        "lead_parado",
        "job_concluido",
        "token_expirando",
        "post_hora",
        "meta_atingida",
      ],
    },
  },
} as const
