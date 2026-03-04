import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { PRIORITY_COLORS } from '../data/constants'

export default function CalendarView({ team, tasks = [] }) {
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
  const cells = []
  for (let i = 0; i < (fd === 0 ? 6 : fd - 1); i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)

  const prevMonth = () => setViewDate(new Date(y, mo - 1, 1))
  const nextMonth = () => setViewDate(new Date(y, mo + 1, 1))

  const MAX_VISIBLE = 3

  return (
    <div className="p-6 overflow-auto h-full w-full">
      {/* Header with month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Calendar size={22} />
        <h1 className="text-2xl font-bold" style={{ letterSpacing: '-0.5px' }}>
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
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[var(--t3)] py-2.5">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((d, i) => {
          const isToday = isCurrentMonth && d === td
          const dayTasks = d
            ? tasks.filter((_, ti) => ((d + ti) % 7 === 0 || (d + ti) % 5 === 0))
            : []
          const visible = dayTasks.slice(0, MAX_VISIBLE)
          const overflow = dayTasks.length - MAX_VISIBLE

          return (
            <div
              key={i}
              className={`min-h-[100px] p-2.5 rounded-lg transition-all duration-150 ${
                d
                  ? isToday
                    ? 'border-2 border-[var(--ac)]'
                    : 'border border-[var(--card-border)] hover:border-[var(--bd2)]'
                  : 'border border-transparent'
              }`}
              style={{
                opacity: d ? 1 : 0.1,
                boxShadow: isToday ? `0 0 0 1px var(--ac)` : d ? 'var(--card-shadow)' : 'none',
                background: isToday ? 'rgba(99,102,241,0.08)' : d ? 'var(--bg2)' : 'transparent',
              }}
            >
              {d && (
                <>
                  <div className="flex items-center mb-1.5">
                    {isToday ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ac)] text-white text-base font-bold">
                        {d}
                      </span>
                    ) : (
                      <span className="text-base font-medium text-[var(--t)]">{d}</span>
                    )}
                  </div>
                  {visible.map((t) => (
                    <div
                      key={t.id}
                      className="text-[11px] px-2.5 py-1 rounded-md font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                      style={{
                        background: PRIORITY_COLORS[t.pr] + '18',
                        color: PRIORITY_COLORS[t.pr],
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                  {overflow > 0 && (
                    <div className="text-[11px] text-[var(--t3)] font-medium px-1 mt-0.5">
                      +{overflow} ещё
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
