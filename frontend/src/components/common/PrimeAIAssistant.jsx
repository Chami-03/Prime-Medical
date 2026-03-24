import { useMemo, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Bot, Send, X } from 'lucide-react'
import { assistantApi } from '../../api/assistantApi'

function toHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))
}

export default function PrimeAIAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello. I am Prime Medical AI Assistant. Ask me about appointments, patient registration, billing, inventory, or clinic workflows.',
    },
  ])
  const listRef = useRef(null)

  const chatMutation = useMutation({
    mutationFn: ({ message, history }) => assistantApi.chat(message, history),
    onSuccess: (res) => {
      const payload = res?.data || res
      const reply = payload?.reply || 'Sorry, I could not generate a response right now.'
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply },
      ])
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
      })
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || 'AI service unavailable right now.'
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: msg }])
    },
  })

  const canSend = input.trim().length > 0 && !chatMutation.isPending

  const placeholder = useMemo(() => {
    if (chatMutation.isPending) return 'Generating reply...'
    return 'Ask about Prime Medical...'
  }, [chatMutation.isPending])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || chatMutation.isPending) return

    const nextUserMessage = { id: `u-${Date.now()}`, role: 'user', content: text }
    const nextMessages = [...messages, nextUserMessage]
    setMessages(nextMessages)
    setInput('')

    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })

    chatMutation.mutate({ message: text, history: toHistory(nextMessages) })
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl shadow-xl border border-white/30
                     bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white
                     flex items-center justify-center hover:scale-105 transition-transform"
          title="Prime Medical AI Assistant"
        >
          <Bot size={26} />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh]
                        bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot size={17} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">Prime Medical AI</p>
                <p className="text-[11px] text-white/80">Real-time assistant</p>
              </div>
            </div>
            <button
              type="button"
              className="p-1 rounded-md hover:bg-white/15"
              onClick={() => setOpen(false)}
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-background">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="text-xs text-muted-foreground">Prime Medical AI is typing...</div>
            )}
          </div>

          <div className="p-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <input
                className="form-input h-10"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={placeholder}
                disabled={chatMutation.isPending}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!canSend}
                className="btn-primary h-10 px-3 disabled:opacity-50"
                title="Send"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
