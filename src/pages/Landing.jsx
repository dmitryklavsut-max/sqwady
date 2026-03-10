import { Zap, ArrowRight, Users, Bot, Sparkles } from 'lucide-react'

export default function Landing({ onGo }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t)] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] radial-glow opacity-40" />
        <div className="absolute inset-0 grid-bg opacity-[0.03]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10 animate-fade-up">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}
          >
            <Zap size={24} />
          </div>
          <span className="text-4xl font-bold tracking-tight logo-gradient">Sqwady</span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5 animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <span className="text-gradient">Построй свою AI-команду</span>
        </h1>

        <p
          className="text-lg text-[var(--t2)] mb-12 leading-relaxed font-light animate-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          Перетаскивай роли, настраивай агентов, запускай продукт — без единой строчки кода.
        </p>

        {/* CTA */}
        <button
          onClick={onGo}
          className="inline-flex items-center gap-3 text-white text-base font-semibold py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 transform animate-fade-up group"
          style={{
            animationDelay: '0.3s',
            background: 'var(--ac)',
            boxShadow: '0 0 30px -5px rgba(99,102,241,0.4)',
          }}
        >
          Начать проект
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Feature pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mt-14 animate-fade-up"
          style={{ animationDelay: '0.4s' }}
        >
          {[
            { icon: Bot, label: '12 AI-ролей' },
            { icon: Users, label: 'Командная работа' },
            { icon: Sparkles, label: 'Без кода' },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--card-border)] bg-[var(--bg2)] text-sm text-[var(--t2)]"
            >
              <Icon size={14} style={{ color: 'var(--ac)' }} />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
