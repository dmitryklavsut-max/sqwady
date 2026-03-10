import { User } from 'lucide-react'

export default function Avatar({ person, size = 40, className = '' }) {
  const fontSize = Math.round(size * 0.38)

  if (!person?.initials) {
    return (
      <div
        className={`flex items-center justify-center rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          background: 'var(--bg3)',
        }}
      >
        <User size={size * 0.5} color="var(--t3)" />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `${person.color}22`,
        color: person.color,
        fontSize,
        lineHeight: 1,
      }}
    >
      {person.initials}
    </div>
  )
}
