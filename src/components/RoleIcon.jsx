import * as LucideIcons from 'lucide-react'

export default function RoleIcon({ name, size = 16, color, className = '' }) {
  const Icon = LucideIcons[name]
  if (!Icon) return null
  return <Icon size={size} color={color} className={className} />
}
