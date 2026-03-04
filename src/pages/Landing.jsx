import { useState } from 'react'
import { ArrowRight, Zap, Bot, Network, Shield, Bolt, Plug, ChartPie, Check, Star, Sun, Moon, Menu, X, Play } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

const FEATURES = [
  { icon: Bot, title: 'Autonomous Agents', desc: 'Deploy specialized AI agents that work 24/7. They code, design, and market your product while you sleep.', color: '#6366f1' },
  { icon: Network, title: 'Seamless Workflow', desc: 'Connect agents together in complex workflows. Watch as tasks flow from PM to Design to Dev automatically.', color: '#06b6d4' },
  { icon: Shield, title: 'Enterprise Security', desc: 'Bank-grade encryption and isolated environments for each agent. Your IP stays safe and secure.', color: '#ec4899' },
  { icon: Bolt, title: 'Instant Scaling', desc: 'Need more power? Spin up 100 new developer agents in seconds with a single click.', color: '#f59e0b' },
  { icon: Plug, title: '100+ Integrations', desc: 'Connects with GitHub, Slack, Jira, Figma, and all your favorite tools out of the box.', color: '#10b981' },
  { icon: ChartPie, title: 'Deep Analytics', desc: 'Track performance, costs, and output quality in real-time with detailed analytics dashboards.', color: '#a855f7' },
]

const STEPS = [
  { num: '01', title: 'Drag roles', desc: 'Choose from 12 specialized AI agent roles for your team.' },
  { num: '02', title: 'Configure agents', desc: 'Set LLM model, memory, personality for each team member.' },
  { num: '03', title: 'Launch & ship', desc: 'Your AI squad starts collaborating immediately. Ship products faster.' },
]

const PRICING = [
  {
    name: 'Starter', price: '$49', period: '/mo', desc: 'Perfect for solo founders and side projects.',
    features: ['2 AI Agents', 'Basic Workflows', '24h Support Turnaround'],
    highlighted: false,
  },
  {
    name: 'Growth', price: '$199', period: '/mo', desc: 'For startups ready to scale operations.',
    features: ['10 AI Agents', 'Advanced Workflows', 'Priority Support', 'Custom Integrations'],
    highlighted: true, badge: 'Most Popular',
  },
  {
    name: 'Enterprise', price: 'Custom', period: '', desc: 'For large organizations with specific needs.',
    features: ['Unlimited Agents', 'Dedicated Success Manager', 'SSO & Advanced Security', 'SLA Guarantees'],
    highlighted: false,
  },
]

export default function Landing({ onGo }) {
  const { theme, toggle: toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--t)] overflow-x-hidden">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--card-border)]" style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                <Zap size={18} />
              </div>
              <span className="text-xl md:text-2xl font-bold tracking-tight logo-gradient">Sqwady</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-sm font-medium text-[var(--t2)] hover:text-[var(--t)] transition-colors">How it works</a>
              <a href="#features" className="text-sm font-medium text-[var(--t2)] hover:text-[var(--t)] transition-colors">Features</a>
              <a href="#pricing" className="text-sm font-medium text-[var(--t2)] hover:text-[var(--t)] transition-colors">Pricing</a>
            </nav>

            <div className="flex items-center gap-3">
              <button onClick={toggleTheme} className="p-2 rounded-lg text-[var(--t3)] hover:text-[var(--t2)] hover:bg-[var(--bg3)] transition-colors" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="hidden sm:flex bg-[var(--ac)] hover:bg-[var(--ac2)] text-white text-sm font-medium py-2 px-4 rounded-lg transition-all" style={{ boxShadow: '0 0 20px -5px rgba(99,102,241,0.4)' }}>
                Join Waitlist
              </button>
              <button className="md:hidden text-[var(--t2)] hover:text-[var(--t)] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[var(--bg2)] border-b border-[var(--card-border)] p-4 flex flex-col gap-3 animate-fade-in">
            <a href="#how-it-works" className="text-base font-medium text-[var(--t2)] hover:text-[var(--t)] p-2 rounded-lg hover:bg-[var(--bg3)]" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#features" className="text-base font-medium text-[var(--t2)] hover:text-[var(--t)] p-2 rounded-lg hover:bg-[var(--bg3)]" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-base font-medium text-[var(--t2)] hover:text-[var(--t)] p-2 rounded-lg hover:bg-[var(--bg3)]" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <div className="h-px bg-[var(--bd)]" />
            <button className="w-full bg-[var(--ac)] text-white font-medium py-3 px-4 rounded-lg">Join Waitlist</button>
          </div>
        )}
      </header>

      <main className="relative pt-20 md:pt-24">
        {/* Background elements */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] radial-glow opacity-60" />
          <div className="absolute inset-0 grid-bg opacity-[0.03]" />
        </div>

        {/* ── Hero ────────────────────────────────────────── */}
        <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 md:pt-32 pb-12 md:pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg3)] border border-[var(--card-border)] mb-10 animate-fade-up" style={{ backdropFilter: 'blur(8px)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" style={{ animation: 'popIn 1s ease infinite' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-emerald-500 tracking-widest uppercase">Now accepting early access</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[84px] font-extrabold leading-[1.1] tracking-tight mb-8 max-w-5xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient">Build your AI squad</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--t2)] max-w-3xl mx-auto mb-12 leading-relaxed font-light animate-fade-up" style={{ animationDelay: '0.2s' }}>
            The no-code OS for AI startups. Drag desks. Seat employees. Ship products. Build the future of automation without a single line of code.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-24 md:mb-32 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={onGo}
              className="w-full sm:w-auto text-white text-[15px] font-semibold py-4 px-10 rounded-xl transition-all hover:-translate-y-0.5 transform"
              style={{ background: '#5856D6', boxShadow: '0 0 30px -5px rgba(88,86,214,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 40px -5px rgba(88,86,214,0.6)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 30px -5px rgba(88,86,214,0.4)'}
            >
              Get Started Free
            </button>
            <button className="w-full sm:w-auto bg-[var(--bg2)] hover:bg-[var(--bg3)] text-[var(--t)] border border-[var(--card-border)] text-[15px] font-medium py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              See how it works
              <Play size={18} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </section>

        {/* ── How It Works ────────────────────────────────── */}
        <section id="how-it-works" className="relative z-10 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it <span className="text-gradient">works</span></h2>
              <p className="text-[var(--t2)] text-lg max-w-2xl mx-auto">Three simple steps to launch your AI-powered startup.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {STEPS.map((step, i) => (
                <div key={step.num} className="glass-card p-8 text-center group" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="text-5xl font-black text-gradient mb-4 opacity-30">{step.num}</div>
                  <h3 className="text-xl font-semibold text-[var(--t)] mb-3">{step.title}</h3>
                  <p className="text-[var(--t2)] leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────── */}
        <section id="features" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to <span className="text-[var(--t)]">scale</span></h2>
              <p className="text-[var(--t2)] text-lg max-w-2xl mx-auto">Manage your entire AI workforce from a single, beautiful dashboard.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {FEATURES.map((f, i) => (
                <div key={f.title} className="glass-card p-8 group hover:-translate-y-1 transition-all duration-200">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors duration-300" style={{ background: `${f.color}15` }}>
                    <f.icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--t)] mb-3">{f.title}</h3>
                  <p className="text-[var(--t2)] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────── */}
        <section id="pricing" className="py-24 bg-[var(--bg2)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent <span style={{ color: 'var(--ac)' }}>pricing</span></h2>
              <p className="text-[var(--t2)]">Scale your AI workforce as you grow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {PRICING.map((plan) => (
                <div
                  key={plan.name}
                  className={`flex flex-col p-8 rounded-2xl border transition-all ${
                    plan.highlighted
                      ? 'border-[var(--ac)] md:-translate-y-4 relative'
                      : 'border-[var(--card-border)] hover:border-[var(--bd2)]'
                  }`}
                  style={{
                    background: plan.highlighted ? 'var(--bg2)' : 'var(--bg2)',
                    boxShadow: plan.highlighted ? '0 0 40px -10px rgba(99,102,241,0.2)' : undefined,
                  }}
                >
                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[var(--ac)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {plan.badge}
                    </div>
                  )}
                  <h3 className="text-lg font-medium text-[var(--t)] mb-2">{plan.name}</h3>
                  <div className="text-3xl font-bold text-[var(--t)] mb-6">
                    {plan.price}<span className="text-base font-normal text-[var(--t2)]">{plan.period}</span>
                  </div>
                  <p className="text-[var(--t2)] text-sm mb-8">{plan.desc}</p>

                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-3 text-sm" style={{ color: plan.highlighted ? 'var(--t)' : 'var(--t2)' }}>
                        <Check size={14} style={{ color: 'var(--ac)', flexShrink: 0 }} /> {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full font-medium py-3 rounded-lg transition-colors ${
                      plan.highlighted
                        ? 'bg-[var(--ac)] hover:bg-[var(--ac2)] text-white'
                        : 'bg-[var(--bg3)] hover:bg-[var(--bg4)] text-[var(--t)] border border-[var(--card-border)]'
                    }`}
                    style={plan.highlighted ? { boxShadow: '0 0 20px -5px rgba(99,102,241,0.4)' } : undefined}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Waitlist CTA ────────────────────────────────── */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'rgba(99,102,241,0.03)' }} />
          <div className="absolute inset-0 grid-bg opacity-[0.05]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-[var(--t)] mb-6">
              Ready to build your <span className="text-gradient">dream team?</span>
            </h2>
            <p className="text-xl text-[var(--t2)] mb-10 max-w-2xl mx-auto">
              Join thousands of founders shipping faster with Sqwady. No credit card required.
            </p>

            <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3" onSubmit={e => e.preventDefault()}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-[var(--bg2)] border border-[var(--card-border)] rounded-lg px-4 py-3.5 text-[var(--t)] placeholder-[var(--t3)] transition-all"
                style={{ outline: 'none' }}
                onFocus={e => { e.target.style.borderColor = 'var(--ac)'; e.target.style.boxShadow = '0 0 0 1px var(--ac)' }}
                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
              />
              <button
                type="submit"
                className="bg-[var(--t)] text-[var(--bg)] font-bold py-3.5 px-6 rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Get Early Access
              </button>
            </form>
            <p className="text-xs text-[var(--t3)] mt-4">Limited spots available for the beta program.</p>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-[var(--bg)] border-t border-[var(--card-border)] pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs" style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                  <Zap size={12} />
                </div>
                <span className="text-xl font-bold text-[var(--t)]">Sqwady</span>
              </div>
              <p className="text-[var(--t2)] text-sm max-w-xs mb-6">The operating system for the next generation of AI-native startups.</p>
            </div>
            <div>
              <h4 className="text-[var(--t)] font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                {['Features', 'Integrations', 'Pricing', 'Changelog', 'Docs'].map(item => (
                  <li key={item}><a href="#" className="text-[var(--t2)] hover:text-[var(--t)] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--t)] font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                {['About', 'Blog', 'Careers', 'Contact'].map(item => (
                  <li key={item}><a href="#" className="text-[var(--t2)] hover:text-[var(--t)] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[var(--t)] font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                {['Privacy', 'Terms', 'Security'].map(item => (
                  <li key={item}><a href="#" className="text-[var(--t2)] hover:text-[var(--t)] transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--card-border)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[var(--t3)]">&copy; 2025 Sqwady Inc. All rights reserved.</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[var(--t3)]">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
