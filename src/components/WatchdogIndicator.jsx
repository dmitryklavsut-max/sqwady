import { useState, useCallback, useRef } from 'react'
import { Shield, ChevronDown, ChevronUp, X, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useNotify } from './Notifications'
import { WatchdogEngine } from '../services/watchdog'
import { DESKS } from '../data/constants'

const SEVERITY_COLORS = {
  warning: '#f59e0b',
  medium: '#f97316',
  high: '#ef4444',
}

const SEVERITY_ICONS = {
  warning: AlertTriangle,
  medium: Clock,
  high: Zap,
}

const TYPE_LABELS = {
  stalled_agent: 'Зависший агент',
  ping_pong: 'Зацикленная задача',
  task_spam: 'Спам задач',
  backtest_fail: 'Возврат задачи',
  idle: 'Простой системы',
  token_anomaly: 'Аномалия генерации',
}

export default function WatchdogIndicator({ collapsed }) {
  const { state, dispatch } = useApp()
  const notify = useNotify()
  const [expanded, setExpanded] = useState(false)
  const [resolvedIds, setResolvedIds] = useState(new Set())
  const engineRef = useRef(null)

  const issues = state.watchdogIssues || []
  const activeIssues = issues.filter(i => !resolvedIds.has(i.id))

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new WatchdogEngine(() => state, dispatch, notify)
    }
    engineRef.current.getState = () => state
    engineRef.current.notify = notify
    return engineRef.current
  }, [state, dispatch, notify])

  const handleManualCheck = () => {
    const engine = getEngine()
    engine.run()
  }

  const handleDismiss = (issueId) => {
    setResolvedIds(prev => new Set([...prev, issueId]))
  }

  // Determine overall status
  const hasHigh = activeIssues.some(i => i.severity === 'high')
  const hasMedium = activeIssues.some(i => i.severity === 'medium')
  const hasWarning = activeIssues.some(i => i.severity === 'warning')

  let statusColor = 'var(--gn)'
  let statusLabel = 'Здорова'
  let statusDot = '🟢'
  if (hasHigh) {
    statusColor = '#ef4444'
    statusLabel = 'Внимание'
    statusDot = '🔴'
  } else if (hasMedium) {
    statusColor = '#f97316'
    statusLabel = `${activeIssues.length} проблем`
    statusDot = '🟡'
  } else if (hasWarning) {
    statusColor = '#f59e0b'
    statusLabel = `${activeIssues.length} предупр.`
    statusDot = '🟡'
  }

  return (
    <>
      {/* Sidebar indicator button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} w-full h-9 rounded-lg border-none cursor-pointer bg-transparent hover:bg-[var(--bg3)] transition-colors duration-150 text-xs`}
        style={{ fontFamily: 'inherit' }}
        title={collapsed ? `Watchdog: ${statusLabel}` : undefined}
      >
        <div className="relative shrink-0">
          <Shield size={16} style={{ color: statusColor }} />
          {activeIssues.length > 0 && (
            <div
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-[var(--bg2)]"
              style={{ background: statusColor }}
            />
          )}
        </div>
        {!collapsed && (
          <span className="text-[var(--t3)]" style={{ color: activeIssues.length > 0 ? statusColor : undefined }}>
            {statusLabel}
          </span>
        )}
      </button>

      {/* Expanded panel (overlay) */}
      {expanded && (
        <div
          className="fixed inset-0 z-[998]"
          onClick={() => setExpanded(false)}
        >
          <div
            className="absolute bottom-16 left-4 w-[380px] max-h-[500px] rounded-2xl border border-[var(--card-border)] bg-[var(--bg2)] overflow-hidden animate-pop"
            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--card-border)]">
              <Shield size={16} style={{ color: statusColor }} />
              <span className="text-sm font-bold text-[var(--t)]">Watchdog</span>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full ml-1"
                style={{ color: statusColor, background: statusColor + '18' }}
              >
                {statusDot} {statusLabel}
              </span>
              <div className="flex-1" />
              <button
                onClick={handleManualCheck}
                className="text-[11px] font-semibold text-[var(--ac)] hover:underline cursor-pointer bg-transparent border-none"
                style={{ fontFamily: 'inherit' }}
              >
                Проверить
              </button>
              <button
                onClick={() => setExpanded(false)}
                className="p-1 rounded-md hover:bg-[var(--bg3)] text-[var(--t3)] cursor-pointer bg-transparent border-none"
              >
                <X size={14} />
              </button>
            </div>

            {/* Issues list */}
            <div className="overflow-y-auto max-h-[400px]">
              {activeIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-[var(--t3)]">
                  <CheckCircle size={32} className="mb-2 text-[var(--gn)] opacity-50" />
                  <p className="text-sm font-medium">Система здорова</p>
                  <p className="text-[11px] mt-1">Проблем не обнаружено</p>
                </div>
              ) : (
                <div className="py-2">
                  {activeIssues.map(issue => {
                    const SevIcon = SEVERITY_ICONS[issue.severity] || AlertTriangle
                    const sevColor = SEVERITY_COLORS[issue.severity] || '#f59e0b'
                    return (
                      <div
                        key={issue.id}
                        className="px-4 py-3 hover:bg-[var(--bg3)] transition-colors border-b border-[var(--card-border)] last:border-b-0"
                      >
                        <div className="flex items-start gap-2.5">
                          <SevIcon size={14} style={{ color: sevColor }} className="shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[var(--t)]">{issue.title}</span>
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ color: sevColor, background: sevColor + '18' }}
                              >
                                {TYPE_LABELS[issue.type] || issue.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--t3)] mt-1 leading-relaxed">
                              {issue.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => {
                                  if (notify) notify('info', `Действие: ${issue.recommendation}`)
                                  handleDismiss(issue.id)
                                }}
                                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer border-none transition-colors"
                                style={{
                                  background: sevColor + '15',
                                  color: sevColor,
                                  fontFamily: 'inherit',
                                }}
                              >
                                {issue.recommendation}
                              </button>
                              <button
                                onClick={() => handleDismiss(issue.id)}
                                className="text-[11px] text-[var(--t3)] hover:text-[var(--t2)] cursor-pointer bg-transparent border-none"
                                style={{ fontFamily: 'inherit' }}
                              >
                                Скрыть
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Resolved section */}
              {resolvedIds.size > 0 && (
                <div className="px-4 py-2 border-t border-[var(--card-border)]">
                  <div className="text-[10px] font-bold text-[var(--t3)] uppercase tracking-wider">
                    Разрешено ({resolvedIds.size})
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
