import { useState } from 'react'
import { DollarSign, TrendingUp, CreditCard, Target, Users, Pencil, X, Check } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts'
import { useApp } from '../context/AppContext'
import Button from './Button'

const KPI_ICONS = [TrendingUp, CreditCard, Target, Users]
const KPI_COLORS = ['var(--gn)', 'var(--ac)', '#f59e0b', '#a855f7']
const KPI_BG = ['rgba(52,211,153,0.1)', 'rgba(99,102,241,0.1)', 'rgba(245,158,11,0.1)', 'rgba(168,85,247,0.1)']

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-[var(--bg2)] border border-[var(--bd2)] rounded-lg px-4 py-3 text-xs"
      style={{ boxShadow: 'var(--shadow-lg)' }}
    >
      <div className="font-semibold text-[var(--t)] mb-2 text-sm">{label}</div>
      {payload.map(p => (
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
  const { state, dispatch } = useApp()
  const econ = state.economics || { months: [], revenue: [], costs: [], users: [] }
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState(null)

  const revenue = econ.revenue || []
  const costs = econ.costs || []
  const users = econ.users || []
  const months = econ.months || Array.from({ length: 12 }, (_, i) => String(i + 1))

  const be = months.findIndex((_, i) => revenue[i] >= costs[i] && revenue[i] > 0)

  const kpis = [
    { l: 'ARR Y1', v: `$${revenue.reduce((a, b) => a + b, 0)}K` },
    { l: 'Total Costs', v: `$${costs.reduce((a, b) => a + b, 0)}K` },
    { l: 'Break-even', v: be >= 0 ? `Мес ${be + 1}` : '—' },
    { l: 'Users M12', v: (users[11] || 0).toLocaleString() },
  ]

  const chartData = months.map((m, i) => ({
    name: `M${m}`,
    revenue: revenue[i] || 0,
    costs: costs[i] || 0,
    users: users[i] || 0,
  }))

  const startEdit = () => {
    setEditData({
      revenue: [...revenue],
      costs: [...costs],
      users: [...users],
    })
    setEditMode(true)
  }

  const saveEdit = () => {
    dispatch({
      type: 'SET_ECONOMICS',
      payload: { ...econ, revenue: editData.revenue, costs: editData.costs, users: editData.users },
    })
    setEditMode(false)
    setEditData(null)
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditData(null)
  }

  const setCell = (field, idx, val) => {
    setEditData(d => ({
      ...d,
      [field]: d[field].map((v, i) => (i === idx ? Number(val) || 0 : v)),
    }))
  }

  return (
    <div className="p-6 overflow-auto h-full w-full">
      <div className="flex items-center gap-2.5 mb-6">
        <DollarSign size={20} />
        <h1 className="text-xl font-bold" style={{ letterSpacing: '-0.5px' }}>Экономика</h1>
        <div className="ml-auto">
          {!editMode ? (
            <Button onClick={startEdit} variant="ghost" small>
              <Pencil size={14} /> Редактировать
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={cancelEdit} variant="ghost" small><X size={14} /> Отмена</Button>
              <Button onClick={saveEdit} small><Check size={14} /> Сохранить</Button>
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {kpis.map((k, i) => {
          const Icon = KPI_ICONS[i]
          return (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--bg2)] transition-all duration-200 animate-fade-up"
              style={{ boxShadow: 'var(--card-shadow)', animationDelay: `${i * 60}ms` }}
            >
              <div
                className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0"
                style={{ background: KPI_BG[i], color: KPI_COLORS[i] }}
              >
                <Icon size={20} />
              </div>
              <div>
                <div className="text-[11px] text-[var(--t3)] font-medium uppercase tracking-wider mb-1">{k.l}</div>
                <div className="text-[24px] font-extrabold leading-none" style={{ color: KPI_COLORS[i] }}>{k.v}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit table */}
      {editMode && editData && (
        <div className="bg-[var(--bg2)] rounded-xl border border-[var(--card-border)] p-4 mb-6 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-[var(--t3)] font-semibold uppercase tracking-wide py-2 pr-3 w-20">Месяц</th>
                {months.map((m, i) => (
                  <th key={i} className="text-center text-[var(--t3)] font-medium py-2 px-1">{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['revenue', 'costs', 'users'].map(field => (
                <tr key={field}>
                  <td className="text-[var(--t2)] font-medium capitalize py-1.5 pr-3">{field === 'revenue' ? 'Revenue' : field === 'costs' ? 'Costs' : 'Users'}</td>
                  {editData[field].map((v, i) => (
                    <td key={i} className="px-0.5 py-1">
                      <input
                        type="number"
                        value={v}
                        onChange={e => setCell(field, i, e.target.value)}
                        className="w-full px-1.5 py-1 rounded text-center text-xs text-[var(--t)] bg-[var(--bg)] border border-[var(--bd)] outline-none focus:border-[var(--ac)]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revenue vs Costs chart */}
      <div className="bg-[var(--bg2)] rounded-xl border border-[var(--card-border)] p-5 mb-4" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold mb-4">Revenue vs Costs ($K)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barGap={2} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={{ stroke: 'var(--bd)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} width={40} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="revenue" fill="#34d399" radius={[3, 3, 0, 0]} />
            <Bar dataKey="costs" fill="#818cf8" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 text-xs text-[var(--t2)]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-2 rounded-full bg-[var(--gn)]" />Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-2 rounded-full bg-[var(--ac)]" />Costs
          </span>
        </div>
      </div>

      {/* User growth chart */}
      <div className="bg-[var(--bg2)] rounded-xl border border-[var(--card-border)] p-5" style={{ boxShadow: 'var(--card-shadow)' }}>
        <h2 className="text-base font-semibold mb-4">User Growth</h2>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={{ stroke: 'var(--bd)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => (v >= 1000 ? `${v / 1000}K` : v)} />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="users" stroke="#a855f7" fill="url(#userGrad)" strokeWidth={2} dot={false} activeDot={{ r: 5, fill: '#a855f7', stroke: 'var(--bg)', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
