import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { CheckCircle, Plus, AlertTriangle, Info, X } from 'lucide-react'

const ICONS = {
  task_completed: CheckCircle,
  new_task: Plus,
  blocker: AlertTriangle,
  info: Info,
  chain: Info,
}

const COLORS = {
  task_completed: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', icon: '#10b981' },
  new_task: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', icon: '#6366f1' },
  blocker: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', icon: '#ef4444' },
  info: { bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.25)', icon: '#94a3b8' },
  chain: { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.25)', icon: '#06b6d4' },
}

const MAX_VISIBLE = 3
const AUTO_DISMISS_MS = 5000

// ── Context for global notifications ────────────────────
const NotifyContext = createContext(null)

export function useNotify() {
  return useContext(NotifyContext)
}

export function NotifyProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((type, message) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => {
      const next = [...prev, { id, type, message, createdAt: Date.now() }]
      // Keep only latest MAX_VISIBLE
      return next.slice(-MAX_VISIBLE)
    })
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <NotifyContext.Provider value={notify}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </NotifyContext.Provider>
  )
}

// ── Toast container (bottom-right) ──────────────────────
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col-reverse gap-2 pointer-events-none" style={{ maxWidth: 360 }}>
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function Toast({ toast, onDismiss }) {
  const { id, type, message } = toast
  const colors = COLORS[type] || COLORS.info
  const Icon = ICONS[type] || Info

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [id, onDismiss])

  return (
    <div
      className="pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl animate-fade-up"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
    >
      <Icon size={16} style={{ color: colors.icon }} className="shrink-0 mt-0.5" />
      <span className="text-[13px] text-[var(--t)] font-medium leading-snug flex-1">{message}</span>
      <button
        onClick={() => onDismiss(id)}
        className="shrink-0 text-[var(--t3)] hover:text-[var(--t)] cursor-pointer bg-transparent border-none p-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
