import { ArrowRight } from 'lucide-react'

export default function Landing({ onGo }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center overflow-hidden relative">
      <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%)' }} />
      <div className="animate-fade-up text-center z-10">
        <div className="text-xs font-semibold text-[var(--ac)] tracking-widest uppercase mb-3.5">
          Welcome to
        </div>
        <div className="text-[64px] font-black tracking-[-3px] mb-2.5"
          style={{
            background: 'linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          Sqwady
        </div>
        <div className="text-[17px] text-[var(--t2)] max-w-[460px] leading-relaxed mb-8">
          Операционная система для AI-стартапа.<br />
          Команда · Roadmap · Экономика · Питчи · Wiki
        </div>
        <button
          onClick={onGo}
          className="flex items-center gap-2 mx-auto px-11 py-3.5 rounded-[14px] border-none cursor-pointer text-white text-[17px] font-bold"
          style={{
            background: 'linear-gradient(135deg, var(--ac2), #8b5cf6)',
            fontFamily: 'inherit',
            boxShadow: '0 8px 32px rgba(99,102,241,0.3)',
          }}>
          Начать
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  )
}
