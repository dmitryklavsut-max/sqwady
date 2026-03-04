import { DollarSign, TrendingUp, CreditCard, Target, Users } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { ECONOMICS } from '../data/constants'

const KPI_ICONS = [TrendingUp, CreditCard, Target, Users]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-[var(--bg2)] border border-[var(--bd2)] rounded-lg px-4 py-3 text-xs"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      <div className="font-semibold text-[var(--t)] mb-2 text-sm">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2.5 py-0.5 text-[var(--t2)]">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="font-semibold text-[var(--t)] ml-auto">
            {p.dataKey === 'users' ? p.value.toLocaleString() : `$${p.value}K`}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function EconomicsView() {
  const be = ECONOMICS.months.findIndex((_, i) => ECONOMICS.revenue[i] >= ECONOMICS.costs[i])

  const kpis = [
    { l: 'ARR Y1', v: `$${ECONOMICS.revenue.reduce((a, b) => a + b, 0)}K`, cl: 'var(--gn)' },
    { l: 'Total Costs', v: `$${ECONOMICS.costs.reduce((a, b) => a + b, 0)}K`, cl: 'var(--ac)' },
    { l: 'Break-even', v: be >= 0 ? `Мес ${be + 1}` : '—', cl: '#f59e0b' },
    { l: 'Users M12', v: ECONOMICS.users[11].toLocaleString(), cl: '#a855f7' },
  ]

  const chartData = ECONOMICS.months.map((m, i) => ({
    name: `M${m}`,
    revenue: ECONOMICS.revenue[i],
    costs: ECONOMICS.costs[i],
    users: ECONOMICS.users[i],
  }))

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <h1 className="flex items-center gap-2.5 text-2xl font-bold mb-6">
        <DollarSign size={22} />
        Экономика
      </h1>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {kpis.map((k, i) => {
          const Icon = KPI_ICONS[i]
          return (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border border-[var(--bd)] bg-[var(--bg2)] hover:border-[var(--bd2)] transition-all duration-200 animate-fade-up"
              style={{ minHeight: 80, boxShadow: 'var(--shadow-card)', animationDelay: `${i * 60}ms` }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{ background: `${k.cl}18`, color: k.cl }}
              >
                <Icon size={20} />
              </div>
              <div>
                <div className="text-xs text-[var(--t3)] font-medium uppercase tracking-wider mb-1">{k.l}</div>
                <div className="text-[28px] font-extrabold leading-none" style={{ color: k.cl }}>{k.v}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Revenue vs Costs chart */}
      <div
        className="bg-[var(--bg2)] rounded-lg border border-[var(--bd)] p-5 mb-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-base font-semibold mb-4">Revenue vs Costs ($K)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--t3)' }}
              axisLine={{ stroke: 'var(--bd)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--t3)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="revenue" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="costs" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 text-xs text-[var(--t2)]">
          <span className="flex items-center gap-2">
            <span className="w-3 h-2.5 rounded-full bg-[var(--gn)]" />
            Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-2.5 rounded-full bg-[var(--ac)]" />
            Costs
          </span>
        </div>
      </div>

      {/* User growth chart */}
      <div
        className="bg-[var(--bg2)] rounded-lg border border-[var(--bd)] p-5"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <h2 className="text-base font-semibold mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: 'var(--t3)' }}
              axisLine={{ stroke: 'var(--bd)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--t3)' }}
              axisLine={false}
              tickLine={false}
              width={45}
              tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : v)}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="users"
              stroke="#a855f7"
              fill="url(#userGrad)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: '#a855f7', stroke: 'var(--bg)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
