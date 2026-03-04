import { useState } from 'react'
import Button from '../components/Button'

export default function ProjectSetup({ onNext }) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="animate-fade-up w-full max-w-[480px] text-center">
        <div className="text-xs font-semibold text-[var(--ac)] tracking-widest uppercase mb-2">Шаг 1</div>
        <div className="text-[26px] font-extrabold mb-6">Опиши проект</div>
        <div className="flex flex-col gap-3 text-left">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            className="w-full px-4 py-3 bg-[var(--bg2)] border-2 border-[var(--bd)] rounded-xl text-[var(--t)] text-base font-semibold outline-none focus:border-[var(--ac)] transition-colors"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
            placeholder="Описание, цели, сроки..."
            className="w-full px-4 py-3 bg-[var(--bg2)] border-2 border-[var(--bd)] rounded-xl text-[var(--t)] text-sm leading-relaxed resize-y outline-none focus:border-[var(--ac)] transition-colors"
          />
        </div>
        <Button
          onClick={() => onNext({ name: name || 'My Project', desc })}
          disabled={!name.trim()}
          style={{ marginTop: 20, padding: '12px 36px' }}
        >
          Собрать команду →
        </Button>
      </div>
    </div>
  )
}
