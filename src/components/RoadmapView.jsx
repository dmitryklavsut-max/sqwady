import { useState } from 'react'
import { Map } from 'lucide-react'
import { ROADMAP } from '../data/constants'

export default function RoadmapView() {
  const months = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
  const [hover, setHover] = useState(null)

  /* Today marker position (fraction of year elapsed) */
  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  const todayPct = ((now - yearStart) / (yearEnd - yearStart)) * 100

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold mb-6">
        <Map size={22} />
        Roadmap
      </h1>

      <div className="relative min-w-[800px]">
        {/* Month headers */}
        <div className="flex border-b border-[var(--bd)] pb-2.5 mb-5">
          {months.map((m, i) => (
            <div key={i} className="flex-1 text-center text-[13px] text-[var(--t3)] font-medium">
              Мес {m}
            </div>
          ))}
        </div>

        {/* Phase bars */}
        {ROADMAP.map((r, idx) => (
          <div
            key={r.id}
            className="mb-4 relative animate-fade-up"
            style={{ height: 56, animationDelay: `${idx * 80}ms` }}
          >
            <div
              className="absolute flex items-center px-5 rounded-xl cursor-pointer transition-all duration-200"
              style={{
                left: `${(r.start / 12) * 100}%`,
                width: `${(r.duration / 12) * 100}%`,
                height: 52,
                background: `${r.color}12`,
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
                <div className="text-xs text-[var(--t2)] mt-0.5 truncate">
                  {r.items.join(' · ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Grid lines */}
        <div className="flex absolute inset-0 pointer-events-none">
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
          className="absolute top-0 bottom-0 w-0.5 bg-[var(--ac)] pointer-events-none z-10"
          style={{ left: `${todayPct}%` }}
        >
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-[var(--ac)] bg-[var(--bg2)] px-2 py-0.5 rounded-md border border-[var(--ac)] whitespace-nowrap">
            Сегодня
          </div>
        </div>
      </div>
    </div>
  )
}
