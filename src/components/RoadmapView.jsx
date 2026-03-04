import { useState } from 'react'
import { Map } from 'lucide-react'
import { ROADMAP } from '../data/constants'

export default function RoadmapView() {
  const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
  const [hover, setHover] = useState(null)

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  const todayPct = ((now - yearStart) / (yearEnd - yearStart)) * 100

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold mb-6" style={{ letterSpacing: '-0.5px' }}>
        <Map size={22} />
        Roadmap
      </h1>

      <div className="relative min-w-[800px]">
        {/* Month headers */}
        <div className="flex border-b border-[var(--bd)] pb-2.5 mb-5">
          {months.map((m, i) => (
            <div key={i} className="flex-1 text-center text-sm text-[var(--t3)] font-medium">
              {m}
            </div>
          ))}
        </div>

        {/* Phase bars */}
        {ROADMAP.map((r, idx) => (
          <div
            key={r.id}
            className="mb-4 relative animate-fade-up"
            style={{ height: 64, animationDelay: `${idx * 80}ms` }}
          >
            <div
              className="absolute flex items-center px-5 rounded-2xl cursor-pointer transition-all duration-200"
              style={{
                left: `${(r.start / 12) * 100}%`,
                width: `${(r.duration / 12) * 100}%`,
                height: 60,
                background: `linear-gradient(135deg, ${r.color}14, ${r.color}08)`,
                border: `2px solid ${hover === r.id ? r.color : r.color + '33'}`,
                boxShadow: hover === r.id ? `0 4px 16px ${r.color}25` : 'none',
              }}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
            >
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: r.color }}>
                  {r.phase}
                </div>
                <div className="text-xs text-[var(--t2)] mt-1 truncate">
                  {r.items.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Grid lines */}
        <div className="flex absolute inset-0 pointer-events-none" style={{ top: 40 }}>
          {months.map((_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ borderRight: i < 11 ? '1px solid var(--bd)' : 'none' }}
            />
          ))}
        </div>

        {/* Today marker */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10"
          style={{ left: `${todayPct}%` }}
        >
          <div className="w-0.5 h-full bg-[var(--ac)]" style={{ borderRight: '1px dashed var(--ac)' }} />
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-[var(--ac)] bg-[var(--bg2)] px-2.5 py-1 rounded-md border border-[var(--ac)] whitespace-nowrap">
            Сегодня
          </div>
        </div>
      </div>
    </div>
  )
}
