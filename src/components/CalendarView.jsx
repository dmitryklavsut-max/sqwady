import { Calendar } from 'lucide-react'
import { PRIORITY_COLORS } from '../data/constants'

export default function CalendarView({ team, tasks = [] }) {
  const now = new Date()
  const y = now.getFullYear()
  const mo = now.getMonth()
  const td = now.getDate()
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const fd = new Date(y, mo, 1).getDay()
  const dim = new Date(y, mo + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < (fd === 0 ? 6 : fd - 1); i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold mb-6">
        <Calendar size={22} />
        {monthNames[mo]} {y}
      </h1>

      <div className="grid grid-cols-7 gap-1.5">
        {/* Day headers */}
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[var(--t3)] py-2.5">
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((d, i) => {
          const isToday = d === td
          const dayTasks = d
            ? tasks.filter((_, ti) => ((d + ti) % 7 === 0 || (d + ti) % 5 === 0)).slice(0, 2)
            : []

          return (
            <div
              key={i}
              className={`min-h-[80px] p-2.5 rounded-lg transition-all duration-150 ${
                d
                  ? isToday
                    ? 'bg-[var(--ac2)]/10 border-2 border-[var(--ac)]'
                    : 'bg-[var(--bg2)] border border-[var(--bd)] hover:border-[var(--bd2)]'
                  : 'border border-transparent'
              }`}
              style={{
                opacity: d ? 1 : 0.1,
                boxShadow: d && !isToday ? 'var(--shadow-card)' : isToday ? `0 0 0 1px var(--ac), var(--shadow-card)` : 'none',
                background: isToday ? 'rgba(99,102,241,0.08)' : d ? 'var(--bg2)' : 'transparent',
              }}
            >
              {d && (
                <>
                  <div
                    className={`text-base mb-1.5 ${
                      isToday ? 'font-bold text-[var(--ac)]' : 'font-medium text-[var(--t)]'
                    }`}
                  >
                    {d}
                  </div>
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      className="text-xs px-2 py-1 rounded-md font-medium mb-1 overflow-hidden text-ellipsis whitespace-nowrap cursor-default"
                      style={{
                        background: PRIORITY_COLORS[t.pr] + '18',
                        color: PRIORITY_COLORS[t.pr],
                      }}
                    >
                      {t.title}
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
