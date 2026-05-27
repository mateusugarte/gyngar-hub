'use client'
import { useState, useCallback, useRef } from 'react'
import type { MarketingAgentMode } from '@/lib/anthropic/agents/marketing-agent'

export interface AgentMessage {
  role: 'user' | 'assistant'
  content: string
}

interface UseMarketingAgentOptions {
  conversationId?: string
  initialMessages?: AgentMessage[]
  onConversationCreated?: (id: string, titulo: string) => void
}

export function useMarketingAgent(options: UseMarketingAgentOptions = {}) {
  const [messages, setMessages] = useState<AgentMessage[]>(options.initialMessages ?? [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(options.conversationId)

  // Refs to avoid stale closures in callbacks
  const convIdRef = useRef<string | undefined>(options.conversationId)
  const onCreatedRef = useRef(options.onConversationCreated)
  onCreatedRef.current = options.onConversationCreated

  const sendMessage = useCallback(async (
    userMessage: string,
    mode: MarketingAgentMode = 'chat',
    opts?: { contentModel?: string; igUrl?: string; file?: File }
  ) => {
    setError(null)
    const newMessages: AgentMessage[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsStreaming(true)
    setStreamingContent('')

    // Create conversation on first message if none exists
    let convId = convIdRef.current
    if (!convId) {
      try {
        const res = await fetch('/api/agent/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: userMessage.slice(0, 60) }),
        })
        if (res.ok) {
          const conv = await res.json() as { id: string; titulo: string }
          convId = conv.id
          convIdRef.current = conv.id
          setCurrentConversationId(conv.id)
          onCreatedRef.current?.(conv.id, conv.titulo ?? userMessage.slice(0, 60))
        }
      } catch {
        // Non-critical — streaming continues even if persistence fails
      }
    }

    // Route based on mode and opts
    let fetchUrl: string
    let fetchInit: RequestInit

    if (mode === 'remodelagem' && opts?.file) {
      const fd = new FormData()
      fd.append('file', opts.file)
      fd.append('userMessage', userMessage)
      fetchUrl = '/api/ai/remodel-upload'
      fetchInit = { method: 'POST', body: fd }
    } else if (mode === 'remodelagem' && opts?.igUrl) {
      fetchUrl = '/api/ai/remodel'
      fetchInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: opts.igUrl, userMessage }),
      }
    } else {
      fetchUrl = '/api/ai/marketing'
      fetchInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, mode, ...opts }),
      }
    }

    try {
      const res = await fetch(fetchUrl, fetchInit)

      if (!res.ok) {
        throw new Error(`Erro ${res.status}: ${res.statusText}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Stream indisponível')

      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              fullContent += parsed.text
              setStreamingContent(fullContent)
            }
          } catch {
            // ignore malformed SSE lines
          }
        }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: fullContent }])

      // Persist the user + assistant pair (fire-and-forget)
      if (convId && fullContent) {
        fetch(`/api/agent/conversations/${convId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([
            { role: 'user', content: userMessage },
            { role: 'assistant', content: fullContent },
          ]),
        }).catch(() => { /* non-critical */ })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(msg)
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
    }
  }, [messages])

  const reset = useCallback(() => {
    setMessages([])
    setStreamingContent('')
    setError(null)
    setCurrentConversationId(undefined)
    convIdRef.current = undefined
  }, [])

  return { messages, isStreaming, streamingContent, error, sendMessage, reset, currentConversationId }
}
