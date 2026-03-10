import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_COLORS } from '../data/constants'
import { useApp } from '../context/AppContext'

const MAX_VISIBLE = 3

export default function CalendarView() {
  const { state } = useApp()
  const tasks = state.tasks || []

  const [viewDate, setViewDate] = useState(() => new Date())

  const y = viewDate.getFullYear()
  const mo = viewDate.getMonth()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === y && today.getMonth() === mo
  const td = today.getDate()

  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const fd = new Date(y, mo, 1).getDay()
  const dim = new Date(y, mo + 1, 0).getDate()
  const prevDim = new Date(y, mo, 0).getDate()

  // Build cells: prev month fill + current month + next month fill
  const startOffset = fd === 0 ? 6 : fd - 1
  const cells = []
  for (let i = startOffset - 1; i >= 0; i--) {
    cells.push({ day: prevDim - i, current: false })
  }
  for (let d = 1; d <= dim; d++) {
    cells.push({ day: d, current: true })
  }
  const remaining = 7 - (cells.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      cells.push({ day: d, current: false })
    }
  }

  // Match tasks to dates
  const getTasksForDay = (day) => {
    if (!day) return []
    const dateStr = `${y}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks.filter(t => t.dueDate === dateStr)
  }

  const prevMonth = () => setViewDate(new Date(y, mo - 1, 1))
  const nextMonth = () => setViewDate(new Date(y, mo + 1, 1))

  return (
    <div className="p-6 overflow-auto h-full w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Calendar size={20} />
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>
          {monthNames[mo]} {y}
        </h1>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center w-9 h-9 rounded-lg border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center w-9 h-9 rounded-lg border-none cursor-pointer bg-[var(--bg3)] text-[var(--t2)] hover:bg-[var(--bg4)] hover:text-[var(--t)] transition-colors"
            aria-label="Следующий месяц"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {/* Day headers */}
        {dayNames.map(d => (
          <div key={d} className="text-center text-[12px] font-bold text-[var(--t3)] uppercase py-2.5">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, i) => {
          const isToday = isCurrentMonth && cell.current && cell.day === td
          const dayTasks = cell.current ? getTasksForDay(cell.day) : []
          const visible = dayTasks.slice(0, MAX_VISIBLE)
          const overflow = dayTasks.length - MAX_VISIBLE

          return (
            <div
              key={i}
              className={`min-h-[80px] p-2 rounded-lg transition-all duration-150 ${
                cell.current
                  ? isToday
                    ? 'border-2 border-[var(--ac)]'
                    : 'border border-[var(--card-border)] hover:border-[var(--bd2)]'
                  : 'border border-transparent'
              }`}
              style={{
                opacity: cell.current ? 1 : 0.2,
                background: isToday ? 'rgba(99,102,241,0.08)' : cell.current ? 'var(--bg2)' : 'transparent',
              }}
            >
              <div className="flex items-center mb-1">
                {isToday ? (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ac)] text-white text-[15px] font-bold">
                    {cell.day}
                  </span>
                ) : (
                  <span className="text-[15px] font-medium text-[var(--t)]">{cell.day}</span>
                )}
              </div>
              {visible.map(t => (
                <div
                  key={t.id}
                  className="text-[10px] px-2 py-0.5 rounded-[5px] font-medium mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{
                    background: (PRIORITY_COLORS[t.priority] || '#94a3b8') + '18',
                    color: PRIORITY_COLORS[t.priority] || '#94a3b8',
                  }}
                  title={t.title}
                >
                  {t.title}
                </div>
              ))}
              {overflow > 0 && (
                <div className="text-[10px] text-[var(--t3)] font-medium px-1 mt-0.5">
                  +{overflow} ещё
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
